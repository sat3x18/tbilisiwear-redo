import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Zap, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAdminFlashSales, useFlashSaleProducts } from "@/hooks/useFlashSale";
import { useProducts } from "@/hooks/useProducts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlashSaleFormData {
  title: string;
  description: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  discount_percentage: number;
}

const defaultFormData: FlashSaleFormData = {
  title: "Flash Sale",
  description: "",
  is_active: false,
  start_time: new Date().toISOString().slice(0, 16),
  end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  discount_percentage: 20,
};

const FlashSalesAdmin = () => {
  const { toast } = useToast();
  const { flashSales, isLoading, createFlashSale, updateFlashSale, deleteFlashSale } = useAdminFlashSales();
  const { products } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlashSaleFormData>(defaultFormData);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [step, setStep] = useState<"details" | "products">("details");

  const { productIds, updateProducts } = useFlashSaleProducts(editingId);

  useEffect(() => {
    if (editingId && productIds.length > 0) {
      setSelectedProducts(productIds);
    }
  }, [editingId, productIds]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setSelectedProducts([]);
    setStep("details");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sale: any) => {
    setEditingId(sale.id);
    setFormData({
      title: sale.title,
      description: sale.description || "",
      is_active: sale.is_active,
      start_time: new Date(sale.start_time).toISOString().slice(0, 16),
      end_time: new Date(sale.end_time).toISOString().slice(0, 16),
      discount_percentage: sale.discount_percentage,
    });
    setStep("details");
    setIsModalOpen(true);
  };

  const handleSaveDetails = async () => {
    try {
      if (editingId) {
        await updateFlashSale.mutateAsync({
          id: editingId,
          ...formData,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
        });
        setStep("products");
      } else {
        const newSale = await createFlashSale.mutateAsync({
          ...formData,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
        });
        setEditingId(newSale.id);
        setStep("products");
      }
    } catch (error) {
      toast({
        title: "Error saving flash sale",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProducts = async () => {
    if (!editingId) return;

    try {
      await updateProducts.mutateAsync({
        flashSaleId: editingId,
        productIds: selectedProducts,
      });
      toast({ title: "Flash sale saved successfully" });
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Error saving products",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flash sale?")) return;
    
    try {
      await deleteFlashSale.mutateAsync(id);
      toast({ title: "Flash sale deleted" });
    } catch (error) {
      toast({
        title: "Error deleting flash sale",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateFlashSale.mutateAsync({ id, is_active: isActive });
      toast({ title: isActive ? "Flash sale activated" : "Flash sale deactivated" });
    } catch (error) {
      toast({
        title: "Error updating flash sale",
        variant: "destructive",
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Flash Sales</h1>
          <p className="text-muted-foreground font-body mt-1">
            Create limited-time deals with countdown timers
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-gold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Flash Sale
        </button>
      </div>

      {/* Flash Sales List */}
      {flashSales.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No Flash Sales Yet</h3>
          <p className="text-muted-foreground font-body mb-6">
            Create your first flash sale to boost sales with limited-time offers.
          </p>
          <button onClick={handleOpenCreate} className="btn-gold">
            Create Flash Sale
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {flashSales.map((sale) => {
            const isExpired = new Date(sale.end_time) < new Date();
            const isUpcoming = new Date(sale.start_time) > new Date();
            
            return (
              <div
                key={sale.id}
                className="bg-card border border-border p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-3 ${sale.is_active && !isExpired ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <Zap className={`w-6 h-6 ${sale.is_active && !isExpired ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  
                  <div>
                    <h3 className="font-display text-lg text-foreground">{sale.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {format(new Date(sale.start_time), "MMM d, yyyy h:mm a")} — {format(new Date(sale.end_time), "MMM d, yyyy h:mm a")}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-secondary px-2 py-1 text-foreground">
                        {sale.discount_percentage}% OFF
                      </span>
                      {isExpired && (
                        <span className="text-xs bg-muted-foreground/20 px-2 py-1 text-muted-foreground">
                          Expired
                        </span>
                      )}
                      {isUpcoming && !isExpired && (
                        <span className="text-xs bg-primary/20 px-2 py-1 text-primary">
                          Upcoming
                        </span>
                      )}
                      {sale.is_active && !isExpired && !isUpcoming && (
                        <span className="text-xs bg-primary/20 px-2 py-1 text-primary font-medium">
                          Live Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${sale.id}`} className="text-sm text-muted-foreground">
                      Active
                    </Label>
                    <Switch
                      id={`active-${sale.id}`}
                      checked={sale.is_active}
                      onCheckedChange={(checked) => handleToggleActive(sale.id, checked)}
                      disabled={isExpired}
                    />
                  </div>
                  
                  <button
                    onClick={() => handleOpenEdit(sale)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingId ? "Edit Flash Sale" : "Create Flash Sale"}
            </DialogTitle>
          </DialogHeader>

          {step === "details" ? (
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-body text-foreground mb-2">Sale Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                  placeholder="Flash Sale"
                />
              </div>

              <div>
                <label className="block text-sm font-body text-foreground mb-2">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body min-h-[80px]"
                  placeholder="Limited time offer on selected items"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body text-foreground mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body text-foreground mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-body text-foreground mb-2">Discount Percentage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                    className="w-24 px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                  />
                  <span className="text-foreground">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-border">
                <div>
                  <p className="font-body text-foreground">Activate immediately</p>
                  <p className="text-sm text-muted-foreground font-body">
                    Turn on to show on homepage when within time range
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-border text-foreground hover:bg-secondary transition-colors font-body"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  disabled={createFlashSale.isPending || updateFlashSale.isPending}
                  className="btn-gold inline-flex items-center gap-2"
                >
                  {(createFlashSale.isPending || updateFlashSale.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Next: Select Products
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <p className="text-muted-foreground font-body">
                Select products to include in this flash sale. The {formData.discount_percentage}% discount will be applied on top of existing prices.
              </p>

              <div className="max-h-[400px] overflow-y-auto space-y-2 border border-border p-4">
                {products.map((product) => {
                  const primaryImage = product.images?.find(img => img.is_primary);
                  const imageUrl = primaryImage?.image_url || product.images?.[0]?.image_url || "/placeholder.svg";
                  const price = product.sale_price || product.base_price;
                  
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-foreground truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand?.name}</p>
                      </div>
                      <p className="text-foreground font-body">
                        ₾{price.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedProducts.length} products selected
              </p>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setStep("details")}
                  className="px-6 py-3 border border-border text-foreground hover:bg-secondary transition-colors font-body"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveProducts}
                  disabled={updateProducts.isPending || selectedProducts.length === 0}
                  className="btn-gold inline-flex items-center gap-2"
                >
                  {updateProducts.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Flash Sale
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashSalesAdmin;
