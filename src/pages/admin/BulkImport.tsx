import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  ArrowLeft,
  Trash2,
  HelpCircle,
  Copy,
  Check,
  FileJson,
  Package,
  ClipboardList,
  Settings2,
  ArrowUp,
} from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParsedProduct {
  rowNumber: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  sale_price: number | null;
  gender: string;
  materials: string;
  care_instructions: string;
  brand_name: string;
  category_name: string;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  variants: string;
  image_urls: string;
  errors: string[];
  status: "pending" | "success" | "error";
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; error: string }[];
}

interface JsonProduct {
  name: string;
  price: number;
  slug?: string;
  description?: string;
  sale_price?: number;
  gender?: string;
  materials?: string;
  care_instructions?: string;
  brand_name?: string;
  category_name?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  variants?: { size: string; color: string; stock?: number }[];
  images?: string[];
}

interface JsonImportData {
  products: JsonProduct[];
}

// Simplified columns - only the essentials
const SIMPLE_COLUMNS = ["name", "price", "size", "color", "stock", "image"];
const REQUIRED_COLUMNS = ["name", "price"];

// Full columns for advanced users
const ALL_COLUMNS = [
  "name",
  "slug",
  "description",
  "base_price",
  "sale_price",
  "gender",
  "materials",
  "care_instructions",
  "brand_name",
  "category_name",
  "is_active",
  "is_featured",
  "is_new_arrival",
  "variants",
  "image_urls",
];

const BulkImport = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const fetchLookupData = useCallback(async () => {
    const [brandsRes, categoriesRes] = await Promise.all([
      supabase.from("brands").select("id, name"),
      supabase.from("categories").select("id, name"),
    ]);
    if (brandsRes.data) setBrands(brandsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    return { brands: brandsRes.data || [], categories: categoriesRes.data || [] };
  }, []);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle simple format (one row per variant)
  const parseSimpleFormat = (
    rows: Record<string, string>[],
    brandsList: { id: string; name: string }[],
    categoriesList: { id: string; name: string }[]
  ): ParsedProduct[] => {
    // Group rows by product name
    const productGroups = new Map<string, Record<string, string>[]>();
    
    rows.forEach((row) => {
      const name = row.name?.trim();
      if (name) {
        if (!productGroups.has(name)) {
          productGroups.set(name, []);
        }
        productGroups.get(name)!.push(row);
      }
    });

    const products: ParsedProduct[] = [];
    let rowNumber = 2;

    productGroups.forEach((groupRows, name) => {
      const firstRow = groupRows[0];
      const errors: string[] = [];

      // Build variants from all rows with same name
      const variants = groupRows
        .filter((r) => r.size?.trim() && r.color?.trim())
        .map((r) => `${r.size.trim()}:${r.color.trim()}:${r.stock?.trim() || "0"}`)
        .join(",");

      // Build images from all rows
      const images = groupRows
        .map((r) => r.image?.trim())
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .join(",");

      // Validate price
      const price = parseFloat(firstRow.price || firstRow.base_price || "0");
      if (!price || isNaN(price)) {
        errors.push("Price is required");
      }

      // Validate brand if provided
      if (firstRow.brand_name?.trim()) {
        const brandExists = brandsList.some(
          (b) => b.name.toLowerCase() === firstRow.brand_name.toLowerCase().trim()
        );
        if (!brandExists) {
          errors.push(`Brand "${firstRow.brand_name}" not found`);
        }
      }

      // Validate category if provided
      if (firstRow.category_name?.trim()) {
        const categoryExists = categoriesList.some(
          (c) => c.name.toLowerCase() === firstRow.category_name.toLowerCase().trim()
        );
        if (!categoryExists) {
          errors.push(`Category "${firstRow.category_name}" not found`);
        }
      }

      products.push({
        rowNumber: rowNumber++,
        name,
        slug: firstRow.slug?.trim() || generateSlug(name),
        description: firstRow.description?.trim() || "",
        base_price: price,
        sale_price: firstRow.sale_price ? parseFloat(firstRow.sale_price) : null,
        gender: (firstRow.gender?.toLowerCase()?.trim() || "both") as "men" | "women" | "both",
        materials: firstRow.materials?.trim() || "",
        care_instructions: firstRow.care_instructions?.trim() || "",
        brand_name: firstRow.brand_name?.trim() || "",
        category_name: firstRow.category_name?.trim() || "",
        is_active: firstRow.is_active?.toLowerCase() !== "false",
        is_featured: firstRow.is_featured?.toLowerCase() === "true",
        is_new_arrival: firstRow.is_new_arrival?.toLowerCase() === "true",
        variants,
        image_urls: images,
        errors,
        status: "pending",
      });
    });

    return products;
  };

  // Handle advanced format (variants in single cell)
  const parseAdvancedFormat = (
    rows: Record<string, string>[],
    brandsList: { id: string; name: string }[],
    categoriesList: { id: string; name: string }[]
  ): ParsedProduct[] => {
    return rows.map((row, index) => {
      const errors: string[] = [];
      const rowNumber = index + 2;

      if (!row.name?.trim()) errors.push("Name is required");
      
      const price = parseFloat(row.base_price || "0");
      if (!price || isNaN(price)) {
        errors.push("Valid base_price is required");
      }

      const slug = row.slug?.trim() || generateSlug(row.name || "");
      if (!slug) errors.push("Slug is required");

      const validGenders = ["men", "women", "both"];
      const gender = row.gender?.toLowerCase()?.trim() || "both";
      if (!validGenders.includes(gender)) {
        errors.push(`Gender must be: men, women, or both`);
      }

      if (row.brand_name?.trim()) {
        const brandExists = brandsList.some(
          (b) => b.name.toLowerCase() === row.brand_name.toLowerCase().trim()
        );
        if (!brandExists) {
          errors.push(`Brand "${row.brand_name}" not found`);
        }
      }

      if (row.category_name?.trim()) {
        const categoryExists = categoriesList.some(
          (c) => c.name.toLowerCase() === row.category_name.toLowerCase().trim()
        );
        if (!categoryExists) {
          errors.push(`Category "${row.category_name}" not found`);
        }
      }

      if (row.variants?.trim()) {
        const variants = row.variants.split(",");
        for (const variant of variants) {
          const parts = variant.split(":");
          if (parts.length !== 3) {
            errors.push(`Invalid variant: "${variant}". Use Size:Color:Stock format`);
            break;
          }
          if (isNaN(parseInt(parts[2]))) {
            errors.push(`Invalid stock in variant: "${variant}"`);
            break;
          }
        }
      }

      return {
        rowNumber,
        name: row.name?.trim() || "",
        slug,
        description: row.description?.trim() || "",
        base_price: price,
        sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
        gender: gender as "men" | "women" | "both",
        materials: row.materials?.trim() || "",
        care_instructions: row.care_instructions?.trim() || "",
        brand_name: row.brand_name?.trim() || "",
        category_name: row.category_name?.trim() || "",
        is_active: row.is_active?.toLowerCase() !== "false",
        is_featured: row.is_featured?.toLowerCase() === "true",
        is_new_arrival: row.is_new_arrival?.toLowerCase() === "true",
        variants: row.variants?.trim() || "",
        image_urls: row.image_urls?.trim() || "",
        errors,
        status: "pending",
      };
    });
  };

  // Handle JSON format
  const parseJsonFormat = (
    data: JsonImportData,
    brandsList: { id: string; name: string }[],
    categoriesList: { id: string; name: string }[]
  ): ParsedProduct[] => {
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('JSON must have a "products" array');
    }

    return data.products.map((product, index) => {
      const errors: string[] = [];
      const rowNumber = index + 1;

      // Validate required fields
      if (!product.name?.trim()) {
        errors.push("Name is required");
      }

      if (typeof product.price !== "number" || isNaN(product.price) || product.price <= 0) {
        errors.push("Valid price is required");
      }

      // Validate brand if provided
      if (product.brand_name?.trim()) {
        const brandExists = brandsList.some(
          (b) => b.name.toLowerCase() === product.brand_name!.toLowerCase().trim()
        );
        if (!brandExists) {
          errors.push(`Brand "${product.brand_name}" not found`);
        }
      }

      // Validate category if provided
      if (product.category_name?.trim()) {
        const categoryExists = categoriesList.some(
          (c) => c.name.toLowerCase() === product.category_name!.toLowerCase().trim()
        );
        if (!categoryExists) {
          errors.push(`Category "${product.category_name}" not found`);
        }
      }

      // Validate gender
      const validGenders = ["men", "women", "both"];
      const gender = product.gender?.toLowerCase()?.trim() || "both";
      if (!validGenders.includes(gender)) {
        errors.push(`Gender must be: men, women, or both`);
      }

      // Validate variants structure
      if (product.variants && !Array.isArray(product.variants)) {
        errors.push("Variants must be an array");
      }

      // Convert variants array to string format
      let variantsString = "";
      if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (!variant.size || !variant.color) {
            errors.push("Each variant must have size and color");
            break;
          }
        }
        variantsString = product.variants
          .filter((v) => v.size && v.color)
          .map((v) => `${v.size}:${v.color}:${v.stock ?? 0}`)
          .join(",");
      }

      // Validate images structure
      if (product.images && !Array.isArray(product.images)) {
        errors.push("Images must be an array of URLs");
      }

      // Convert images array to string
      const imagesString = Array.isArray(product.images)
        ? product.images.filter((url) => typeof url === "string" && url.trim()).join(",")
        : "";

      return {
        rowNumber,
        name: product.name?.trim() || "",
        slug: product.slug?.trim() || generateSlug(product.name || ""),
        description: product.description?.trim() || "",
        base_price: product.price || 0,
        sale_price: product.sale_price ?? null,
        gender: gender as "men" | "women" | "both",
        materials: product.materials?.trim() || "",
        care_instructions: product.care_instructions?.trim() || "",
        brand_name: product.brand_name?.trim() || "",
        category_name: product.category_name?.trim() || "",
        is_active: product.is_active !== false,
        is_featured: product.is_featured === true,
        is_new_arrival: product.is_new_arrival === true,
        variants: variantsString,
        image_urls: imagesString,
        errors,
        status: "pending",
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isJson = selectedFile.name.endsWith(".json");
    const isCsv = selectedFile.name.endsWith(".csv");

    if (!isJson && !isCsv) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or JSON file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setImportResult(null);

    const { brands: brandsList, categories: categoriesList } = await fetchLookupData();

    if (isJson) {
      // Handle JSON file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string) as JsonImportData;
          const parsed = parseJsonFormat(jsonData, brandsList, categoriesList);
          
          setParsedData(parsed);
          setIsParsing(false);

          const errorCount = parsed.filter((p) => p.errors.length > 0).length;
          toast({
            title: "JSON file processed",
            description: `${parsed.length} products found. ${errorCount > 0 ? `${errorCount} have errors.` : "Ready to import"}`,
          });
        } catch (error: any) {
          toast({
            title: "Invalid JSON",
            description: error.message || "Failed to parse JSON file",
            variant: "destructive",
          });
          setIsParsing(false);
          setFile(null);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Read error",
          description: "Failed to read file",
          variant: "destructive",
        });
        setIsParsing(false);
        setFile(null);
      };
      reader.readAsText(selectedFile);
    } else {
      // Handle CSV file (existing logic)
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, string>[];

          // Detect format: simple (has 'price', 'size', 'color') or advanced (has 'base_price', 'variants')
          const isSimpleFormat = headers.includes("price") || 
            (headers.includes("size") && headers.includes("color"));
          
          let parsed: ParsedProduct[];
          
          if (isSimpleFormat) {
            // Check for required simple columns
            if (!headers.includes("name")) {
              toast({
                title: "Missing column",
                description: "CSV must have a 'name' column",
                variant: "destructive",
              });
              setIsParsing(false);
              setFile(null);
              return;
            }
            parsed = parseSimpleFormat(rows, brandsList, categoriesList);
          } else {
            // Advanced format - check for required columns
            const missingColumns = ["name", "base_price"].filter(
              (col) => !headers.includes(col)
            );
            
            if (missingColumns.length > 0) {
              toast({
                title: "Missing required columns",
                description: `Please include: ${missingColumns.join(", ")}`,
                variant: "destructive",
              });
              setIsParsing(false);
              setFile(null);
              return;
            }
            parsed = parseAdvancedFormat(rows, brandsList, categoriesList);
          }

          setParsedData(parsed);
          setIsParsing(false);

          const errorCount = parsed.filter((p) => p.errors.length > 0).length;
          toast({
            title: "File processed",
            description: `${parsed.length} products found. ${errorCount > 0 ? `${errorCount} have errors.` : "Ready to import"}`,
            variant: errorCount > 0 ? "default" : "default",
          });
        },
        error: (error) => {
          toast({
            title: "Parse error",
            description: error.message,
            variant: "destructive",
          });
          setIsParsing(false);
          setFile(null);
        },
      });
    }
  };

  const handleImport = async () => {
    const validProducts = parsedData.filter((p) => p.errors.length === 0);
    
    if (validProducts.length === 0) {
      toast({
        title: "No valid products",
        description: "Please fix all errors before importing",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = {
      total: validProducts.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      
      try {
        let brandId: string | null = null;
        if (product.brand_name) {
          const brand = brands.find(
            (b) => b.name.toLowerCase() === product.brand_name.toLowerCase()
          );
          brandId = brand?.id || null;
        }

        let categoryId: string | null = null;
        if (product.category_name) {
          const category = categories.find(
            (c) => c.name.toLowerCase() === product.category_name.toLowerCase()
          );
          categoryId = category?.id || null;
        }

        const { data: insertedProduct, error: productError } = await supabase
          .from("products")
          .insert({
            name: product.name,
            slug: product.slug,
            description: product.description || null,
            base_price: product.base_price,
            sale_price: product.sale_price,
            gender: product.gender,
            materials: product.materials || null,
            care_instructions: product.care_instructions || null,
            brand_id: brandId,
            category_id: categoryId,
            is_active: product.is_active,
            is_featured: product.is_featured,
            is_new_arrival: product.is_new_arrival,
          })
          .select("id")
          .single();

        if (productError) throw productError;

        if (product.variants && insertedProduct) {
          const variants = product.variants.split(",").map((v) => {
            const [size, color, stock] = v.split(":");
            return {
              product_id: insertedProduct.id,
              size: size.trim(),
              color: color.trim(),
              stock_quantity: parseInt(stock) || 0,
            };
          });

          await supabase.from("product_variants").insert(variants);
        }

        if (product.image_urls && insertedProduct) {
          const images = product.image_urls.split(",").map((url, index) => ({
            product_id: insertedProduct.id,
            image_url: url.trim(),
            display_order: index,
            is_primary: index === 0,
          }));

          await supabase.from("product_images").insert(images);
        }

        result.successful++;
        
        setParsedData((prev) =>
          prev.map((p) =>
            p.rowNumber === product.rowNumber ? { ...p, status: "success" } : p
          )
        );
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: product.rowNumber,
          error: error.message || "Unknown error",
        });
        
        setParsedData((prev) =>
          prev.map((p) =>
            p.rowNumber === product.rowNumber
              ? { ...p, status: "error", errors: [...p.errors, error.message] }
              : p
          )
        );
      }

      setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
    }

    setImportResult(result);
    setIsImporting(false);

    toast({
      title: "Import complete",
      description: `${result.successful} products imported, ${result.failed} failed.`,
      variant: result.failed > 0 ? "destructive" : "default",
    });
  };

  const downloadSimpleTemplate = () => {
    const headers = "name,price,size,color,stock,image,brand_name,category_name";
    const examples = [
      "Classic T-Shirt,49.99,S,Black,10,https://example.com/tshirt-black.jpg,Nike,T-Shirts",
      "Classic T-Shirt,49.99,M,Black,15,https://example.com/tshirt-black.jpg,Nike,T-Shirts",
      "Classic T-Shirt,49.99,L,Black,20,https://example.com/tshirt-black.jpg,Nike,T-Shirts",
      "Classic T-Shirt,49.99,S,White,8,https://example.com/tshirt-white.jpg,Nike,T-Shirts",
      "Classic T-Shirt,49.99,M,White,12,https://example.com/tshirt-white.jpg,Nike,T-Shirts",
      "Slim Jeans,89.99,30,Blue,5,https://example.com/jeans.jpg,Levis,Pants",
      "Slim Jeans,89.99,32,Blue,10,https://example.com/jeans.jpg,Levis,Pants",
      "Slim Jeans,89.99,34,Blue,8,https://example.com/jeans.jpg,Levis,Pants",
    ].join("\n");

    const csvContent = `${headers}\n${examples}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "simple_product_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAdvancedTemplate = () => {
    const headers = ALL_COLUMNS.join(",");
    const exampleRow = [
      "Premium Cotton T-Shirt",
      "premium-cotton-tshirt",
      "Soft organic cotton t-shirt",
      "89.99",
      "79.99",
      "both",
      "100% Organic Cotton",
      "Machine wash cold",
      "Nike",
      "T-Shirts",
      "true",
      "false",
      "true",
      "S:Black:10,M:Black:15,L:Black:20",
      "https://example.com/img1.jpg,https://example.com/img2.jpg",
    ].join(",");

    const csvContent = `${headers}\n${exampleRow}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "advanced_product_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonTemplate = () => {
    const template: JsonImportData = {
      products: [
        {
          name: "Classic T-Shirt",
          price: 49.99,
          description: "Soft cotton t-shirt for everyday wear",
          brand_name: "Nike",
          category_name: "T-Shirts",
          gender: "both",
          materials: "100% Cotton",
          care_instructions: "Machine wash cold",
          is_featured: false,
          is_new_arrival: true,
          variants: [
            { size: "S", color: "Black", stock: 10 },
            { size: "M", color: "Black", stock: 15 },
            { size: "L", color: "Black", stock: 20 },
            { size: "S", color: "White", stock: 8 },
            { size: "M", color: "White", stock: 12 },
          ],
          images: [
            "https://example.com/tshirt-front.jpg",
            "https://example.com/tshirt-back.jpg",
          ],
        },
        {
          name: "Slim Fit Jeans",
          price: 89.99,
          sale_price: 69.99,
          description: "Modern slim fit denim jeans",
          brand_name: "Levis",
          category_name: "Pants",
          gender: "men",
          materials: "98% Cotton, 2% Elastane",
          care_instructions: "Wash inside out",
          is_featured: true,
          is_new_arrival: false,
          variants: [
            { size: "30", color: "Blue", stock: 5 },
            { size: "32", color: "Blue", stock: 10 },
            { size: "34", color: "Blue", stock: 8 },
            { size: "32", color: "Black", stock: 7 },
          ],
          images: [
            "https://example.com/jeans-front.jpg",
            "https://example.com/jeans-detail.jpg",
          ],
        },
      ],
    };

    const jsonContent = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_template.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const clearData = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setImportProgress(0);
  };

  const validCount = parsedData.filter((p) => p.errors.length === 0).length;
  const errorCount = parsedData.filter((p) => p.errors.length > 0).length;

  const jsonExampleString = `{
  "products": [
    {
      "name": "Classic T-Shirt",
      "price": 49.99,
      "brand_name": "Nike",
      "category_name": "T-Shirts",
      "variants": [
        { "size": "S", "color": "Black", "stock": 10 },
        { "size": "M", "color": "Black", "stock": 15 }
      ],
      "images": ["https://example.com/img.jpg"]
    }
  ]
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl text-foreground">Bulk Import Products</h1>
            <p className="text-muted-foreground font-body mt-1">
              Upload multiple products at once using a CSV or JSON file
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      {!file && (
        <>
          <Alert className="bg-primary/5 border-primary/20">
            <HelpCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Quick Start:</strong> Download a template, fill it in, and upload here. Use CSV for spreadsheets or JSON for developers.
            </AlertDescription>
          </Alert>

          {/* Template Downloads */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Simple CSV Template Card */}
            <div className="bg-card border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-display text-xl text-foreground">Simple CSV</h3>
              </div>
              <p className="text-muted-foreground font-body text-sm">
                Easy format - one row per size/color. Best for spreadsheet users.
              </p>
              <div className="bg-secondary/50 p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-muted-foreground">name, price, size, color, stock</div>
              </div>
              <button
                onClick={downloadSimpleTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground hover:bg-secondary transition-colors font-body text-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            {/* JSON Template Card */}
            <div className="bg-card border-2 border-primary/30 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-6 h-6 text-primary" />
                <h3 className="font-display text-xl text-foreground">JSON</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">Recommended</span>
              </div>
              <p className="text-muted-foreground font-body text-sm">
                Clean structure with nested variants & images. Best for developers.
              </p>
              <div className="bg-secondary/50 p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-muted-foreground">{`{ "products": [...] }`}</div>
              </div>
              <button
                onClick={downloadJsonTemplate}
                className="w-full btn-gold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>

            {/* Advanced CSV Template Card */}
            <div className="bg-card border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-display text-xl text-foreground">Advanced CSV</h3>
              </div>
              <p className="text-muted-foreground font-body text-sm">
                All fields in one row per product. For power users.
              </p>
              <div className="bg-secondary/50 p-3 rounded text-xs font-mono overflow-x-auto">
                <div className="text-muted-foreground">name, base_price, variants, ...</div>
              </div>
              <button
                onClick={downloadAdvancedTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground hover:bg-secondary transition-colors font-body text-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-card border border-border p-8">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer rounded-lg">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-primary mb-3" />
                <p className="mb-2 text-foreground font-body">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  CSV or JSON file
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* How It Works */}
          <Accordion type="single" collapsible className="bg-card border border-border">
            <AccordionItem value="json" className="border-b border-border">
              <AccordionTrigger className="px-6 font-display text-lg hover:no-underline">
                <span className="flex items-center gap-2"><Package aria-hidden="true" className="h-5 w-5 shrink-0" />How JSON Format Works</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground font-body">
                    JSON provides a clean, structured format that's easy to read and edit. Variants and images are nested arrays.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Example JSON Structure:</p>
                    <div className="bg-secondary/50 p-4 rounded font-mono text-xs overflow-x-auto relative">
                      <button 
                        onClick={() => copyToClipboard(jsonExampleString, "json")}
                        className="absolute top-2 right-2 p-1.5 hover:bg-secondary rounded"
                      >
                        {copiedExample === "json" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <pre className="text-foreground whitespace-pre-wrap">{jsonExampleString}</pre>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-medium text-foreground mb-2">Required Fields:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>name</strong> - Product name</li>
                        <li>• <strong>price</strong> - Product price (number)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Optional Fields:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>description</strong> - Product description</li>
                        <li>• <strong>sale_price</strong> - Sale price (number)</li>
                        <li>• <strong>gender</strong> - "men", "women", or "both"</li>
                        <li>• <strong>brand_name</strong> - Brand name (must exist)</li>
                        <li>• <strong>category_name</strong> - Category (must exist)</li>
                        <li>• <strong>materials</strong> - Material description</li>
                        <li>• <strong>care_instructions</strong> - Care info</li>
                        <li>• <strong>is_featured</strong> - true/false</li>
                        <li>• <strong>is_new_arrival</strong> - true/false</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium text-foreground mb-2">Variants Array:</p>
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm">
                      {`"variants": [{ "size": "S", "color": "Black", "stock": 10 }]`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each variant requires <strong>size</strong> and <strong>color</strong>. Stock defaults to 0.
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium text-foreground mb-2">Images Array:</p>
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm">
                      {`"images": ["https://example.com/front.jpg", "https://example.com/back.jpg"]`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      First image becomes the primary image.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="simple" className="border-b border-border">
              <AccordionTrigger className="px-6 font-display text-lg hover:no-underline">
                <span className="flex items-center gap-2"><ClipboardList aria-hidden="true" className="h-5 w-5 shrink-0" />How Simple CSV Works</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground font-body">
                    Each row is one size/color combination. Products with the same name are grouped automatically.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Example: T-Shirt with 3 sizes in 2 colors</p>
                    <div className="bg-secondary/50 p-4 rounded font-mono text-xs overflow-x-auto relative">
                      <button 
                        onClick={() => copyToClipboard(
                          "name,price,size,color,stock,image\nClassic T-Shirt,49.99,S,Black,10,https://img.com/black.jpg\nClassic T-Shirt,49.99,M,Black,15,https://img.com/black.jpg\nClassic T-Shirt,49.99,L,Black,20,https://img.com/black.jpg\nClassic T-Shirt,49.99,S,White,8,https://img.com/white.jpg\nClassic T-Shirt,49.99,M,White,12,https://img.com/white.jpg",
                          "simple"
                        )}
                        className="absolute top-2 right-2 p-1.5 hover:bg-secondary rounded"
                      >
                        {copiedExample === "simple" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <table className="w-full">
                        <thead className="text-muted-foreground">
                          <tr>
                            <td className="pr-4">name</td>
                            <td className="pr-4">price</td>
                            <td className="pr-4">size</td>
                            <td className="pr-4">color</td>
                            <td className="pr-4">stock</td>
                            <td>image</td>
                          </tr>
                        </thead>
                        <tbody className="text-foreground">
                          <tr><td>Classic T-Shirt</td><td>49.99</td><td>S</td><td>Black</td><td>10</td><td>https://...</td></tr>
                          <tr><td>Classic T-Shirt</td><td>49.99</td><td>M</td><td>Black</td><td>15</td><td>https://...</td></tr>
                          <tr><td>Classic T-Shirt</td><td>49.99</td><td>L</td><td>Black</td><td>20</td><td>https://...</td></tr>
                          <tr><td>Classic T-Shirt</td><td>49.99</td><td>S</td><td>White</td><td>8</td><td>https://...</td></tr>
                          <tr><td>Classic T-Shirt</td><td>49.99</td><td>M</td><td>White</td><td>12</td><td>https://...</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <ArrowUp aria-hidden="true" className="inline-block h-4 w-4 mr-1 align-text-bottom" />This creates <strong>1 product</strong> with 5 variants (3 Black + 2 White sizes)
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-medium text-foreground mb-2">Required Columns:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>name</strong> - Product name</li>
                        <li>• <strong>price</strong> - Product price</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Optional Columns:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>size</strong> - Size (S, M, L, etc.)</li>
                        <li>• <strong>color</strong> - Color name</li>
                        <li>• <strong>stock</strong> - Quantity available</li>
                        <li>• <strong>image</strong> - Image URL</li>
                        <li>• <strong>brand_name</strong> - Brand name (must exist)</li>
                        <li>• <strong>category_name</strong> - Category name (must exist)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="px-6 font-display text-lg hover:no-underline">
                <span className="flex items-center gap-2"><Settings2 aria-hidden="true" className="h-5 w-5 shrink-0" />How Advanced CSV Works</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground font-body">
                    One row per product. Variants and images are comma-separated in single cells.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Variant Format:</p>
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm">
                      Size:Color:Stock,Size:Color:Stock
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: <code className="bg-secondary px-1 rounded">S:Black:10,M:Black:15,L:White:20</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Image URLs Format:</p>
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm">
                      url1,url2,url3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      First image becomes the primary/main image.
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium text-foreground mb-2">All Columns:</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_COLUMNS.map((col) => (
                        <span 
                          key={col} 
                          className={`px-2 py-1 text-xs rounded ${
                            ["name", "base_price"].includes(col) 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * Highlighted columns are required
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      {/* Parsing State */}
      {isParsing && (
        <div className="bg-card border border-border p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-foreground font-body">Processing your file...</p>
        </div>
      )}

      {/* Preview & Import */}
      {file && parsedData.length > 0 && !isParsing && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {file.name.endsWith(".json") ? (
                  <FileJson className="w-5 h-5 text-primary" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                )}
                <span className="text-foreground font-body font-medium">{file.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-body">
                <span className="px-2 py-1 bg-secondary rounded">
                  {parsedData.length} products
                </span>
                <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded">
                  {validCount} ready
                </span>
                {errorCount > 0 && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-600 rounded">
                    {errorCount} errors
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearData}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
                className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {validCount} Products
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-body text-foreground">
                  Importing products...
                </span>
                <span className="text-sm font-body text-muted-foreground">
                  {importProgress}%
                </span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`p-4 border rounded-lg ${
                importResult.failed > 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-green-500/10 border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {importResult.failed > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="font-body text-foreground font-medium">
                    {importResult.failed === 0 
                      ? `Imported ${importResult.successful} products` 
                      : `${importResult.successful} imported, ${importResult.failed} failed`
                    }
                  </p>
                  {importResult.errors.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Check the table below for error details
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-card border border-border overflow-hidden rounded-lg">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-body w-16">Status</TableHead>
                    <TableHead className="text-muted-foreground font-body">Name</TableHead>
                    <TableHead className="text-muted-foreground font-body w-24">Price</TableHead>
                    <TableHead className="text-muted-foreground font-body">Brand</TableHead>
                    <TableHead className="text-muted-foreground font-body">Category</TableHead>
                    <TableHead className="text-muted-foreground font-body w-24">Variants</TableHead>
                    <TableHead className="text-muted-foreground font-body">Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={`border-border ${
                        row.errors.length > 0
                          ? "bg-red-500/5"
                          : row.status === "success"
                          ? "bg-green-500/5"
                          : ""
                      }`}
                    >
                      <TableCell>
                        {row.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : row.errors.length > 0 ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-primary/50" />
                        )}
                      </TableCell>
                      <TableCell className="font-body text-foreground font-medium">
                        {row.name || <span className="text-red-500">Missing</span>}
                      </TableCell>
                      <TableCell className="font-body text-foreground">
                        ₾{row.base_price.toFixed(2)}
                        {row.sale_price && (
                          <span className="text-muted-foreground text-xs ml-1">
                            (₾{row.sale_price})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground">
                        {row.brand_name || "-"}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground">
                        {row.category_name || "-"}
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground">
                        {row.variants
                          ? `${row.variants.split(",").length}`
                          : "0"}
                      </TableCell>
                      <TableCell className="font-body text-red-500 text-sm max-w-64">
                        {row.errors.length > 0 ? row.errors.join("; ") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
