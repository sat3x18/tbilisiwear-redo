import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Package, ToggleLeft, ToggleRight, Home, ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAdminBundles, calculateBundlePrice } from "@/hooks/useBundles";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/formatPrice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Bundles = () => {
  const { bundles, loading, deleteBundle, toggleActive } = useAdminBundles();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBundle(id);
      toast({
        title: "Bundle deleted",
        description: "The bundle has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bundle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive(id, !currentStatus);
      toast({
        title: currentStatus ? "Bundle deactivated" : "Bundle activated",
        description: `The bundle is now ${currentStatus ? "hidden from" : "visible to"} customers.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bundle status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium text-foreground">Bundle Deals</h1>
          <p className="text-muted-foreground mt-1">
            Create product bundles to offer customers savings when buying together
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/bundles/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bundles</CardTitle>
          <CardDescription>
            Manage your bundle deals. Bundles allow customers to save when purchasing multiple products together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bundles.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No bundles yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bundle to offer a bundle price
              </p>
              <Button asChild>
                <Link to="/admin/bundles/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bundle
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => {
                  const pricing = calculateBundlePrice(bundle);
                  return (
                    <TableRow key={bundle.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{bundle.name}</p>
                          <p className="text-sm text-muted-foreground">{bundle.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {bundle.products.length} products
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {bundle.pricing_type === 'fixed' ? (
                            <p className="font-medium">{formatPrice(bundle.fixed_price || 0)}</p>
                          ) : (
                            <p className="font-medium">{bundle.discount_value}% off</p>
                          )}
                          {pricing.savings > 0 && (
                            <p className="text-sm text-green-600">
                              Save {formatPrice(pricing.savings)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {bundle.show_on_homepage && (
                            <Badge variant="outline" className="text-xs">
                              <Home className="w-3 h-3 mr-1" />
                              Home
                            </Badge>
                          )}
                          {bundle.show_on_bundles_page && (
                            <Badge variant="outline" className="text-xs">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Bundles
                            </Badge>
                          )}
                          {bundle.show_on_product_pages && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Products
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(bundle.id, bundle.is_active)}
                          className="flex items-center gap-1"
                        >
                          {bundle.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Inactive</span>
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/bundles/${bundle.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{bundle.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(bundle.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === bundle.id}
                                >
                                  {deletingId === bundle.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Bundles;
