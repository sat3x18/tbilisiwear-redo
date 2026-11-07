import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Address {
  id: string;
  label: string;
  full_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

const emptyAddress = {
  label: "Home",
  full_name: "",
  street_address: "",
  apartment: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Georgia",
  phone: "",
  is_default: false,
};

const Addresses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingAddress(emptyAddress);
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAddress || !user) return;
    setSaving(true);

    const addressData = {
      ...editingAddress,
      user_id: user.id,
    };

    if ('id' in editingAddress && editingAddress.id) {
      // Update existing
      const { id, ...updateData } = addressData;
      const { error } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', editingAddress.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update address.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Address updated" });
        fetchAddresses();
      }
    } else {
      // Create new - ensure required fields
      const insertData = {
        user_id: user.id,
        label: editingAddress.label || 'Home',
        full_name: editingAddress.full_name || '',
        street_address: editingAddress.street_address || '',
        apartment: editingAddress.apartment || null,
        city: editingAddress.city || '',
        state: editingAddress.state || null,
        postal_code: editingAddress.postal_code || '',
        country: editingAddress.country || 'Georgia',
        phone: editingAddress.phone || null,
        is_default: editingAddress.is_default || false,
      };
      const { error } = await supabase
        .from('addresses')
        .insert(insertData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add address.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Address added" });
        fetchAddresses();
      }
    }

    setSaving(false);
    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: "Address deleted" });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete address.",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const setAsDefault = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user?.id);

    // Then set the new default
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (!error) {
      fetchAddresses();
      toast({ title: "Default address updated" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Saved Addresses</h2>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 text-primary hover:text-foreground transition-colors font-body text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No saved addresses</h3>
          <p className="text-muted-foreground font-body mb-6">
            Add an address to make checkout faster.
          </p>
          <button onClick={openAddDialog} className="btn-gold inline-block">
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-card border p-6 relative ${
                address.is_default ? 'border-primary' : 'border-border'
              }`}
            >
              {address.is_default && (
                <span className="absolute top-4 right-4 px-2 py-1 bg-primary text-primary-foreground text-xs ">
                  Default
                </span>
              )}
              
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-display text-lg text-foreground">{address.label}</span>
                  </div>
                  <div className="text-muted-foreground font-body space-y-1 text-sm">
                    <p>{address.full_name}</p>
                    <p>{address.street_address}</p>
                    {address.apartment && <p>{address.apartment}</p>}
                    <p>{address.city}, {address.state} {address.postal_code}</p>
                    <p>{address.country}</p>
                    {address.phone && <p>{address.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => openEditDialog(address)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                {!address.is_default && (
                  <button
                    onClick={() => setAsDefault(address.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors ml-auto"
                >
                  {deletingId === address.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingAddress?.id ? 'Edit Address' : 'Add Address'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">Label</label>
                <input
                  type="text"
                  value={editingAddress?.label || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, label: e.target.value }))}
                  placeholder="Home, Work, etc."
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">Full Name</label>
                <input
                  type="text"
                  value={editingAddress?.full_name || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, full_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2 font-body">Street Address</label>
              <input
                type="text"
                value={editingAddress?.street_address || ''}
                onChange={(e) => setEditingAddress(prev => ({ ...prev!, street_address: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2 font-body">Apartment, Suite, etc. (Optional)</label>
              <input
                type="text"
                value={editingAddress?.apartment || ''}
                onChange={(e) => setEditingAddress(prev => ({ ...prev!, apartment: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">City</label>
                <input
                  type="text"
                  value={editingAddress?.city || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">State/Province</label>
                <input
                  type="text"
                  value={editingAddress?.state || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, state: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">Postal Code</label>
                <input
                  type="text"
                  value={editingAddress?.postal_code || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, postal_code: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">Country</label>
                <input
                  type="text"
                  value={editingAddress?.country || ''}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev!, country: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2 font-body">Phone (Optional)</label>
              <input
                type="tel"
                value={editingAddress?.phone || ''}
                onChange={(e) => setEditingAddress(prev => ({ ...prev!, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={editingAddress?.is_default || false}
                onChange={(e) => setEditingAddress(prev => ({ ...prev!, is_default: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="is_default" className="text-sm text-muted-foreground font-body">
                Set as default address
              </label>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-6 py-3 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-gold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingAddress?.id ? 'Update' : 'Add'} Address
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Addresses;
