import { useState, useEffect } from "react";
import { Save, Loader2, Store, Mail, Globe, CreditCard, Palette, User, Plus, Trash2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

interface BankAccount {
  id: string;
  bank_name: string;
  iban: string;
  is_active: boolean;
  display_order: number;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, isUpdating, isLoading } = useStoreSettings();
  const { user } = useAuth();

  // Store Settings
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [currency, setCurrency] = useState("");

  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [standardShippingCost, setStandardShippingCost] = useState("");
  const [expressShippingCost, setExpressShippingCost] = useState("");

  // Payment Settings
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialMessenger, setSocialMessenger] = useState("");

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [newBankName, setNewBankName] = useState("");
  const [newIban, setNewIban] = useState("");

  // Owner email
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [showEmailOtpDialog, setShowEmailOtpDialog] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  // Initialize form with current settings
  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setStoreEmail(settings.store_email);
      setStorePhone(settings.store_phone);
      setStoreAddress(settings.store_address);
      setCurrency(settings.currency);
      setFreeShippingThreshold(settings.free_shipping_threshold);
      setStandardShippingCost(settings.standard_shipping_cost);
      setExpressShippingCost(settings.express_shipping_cost);
      setPaymentsEnabled(settings.payments_enabled);
      setSocialInstagram(settings.social_instagram);
      setSocialFacebook(settings.social_facebook);
      setSocialTiktok(settings.social_tiktok);
      setSocialMessenger(settings.social_messenger);
    }
  }, [settings]);

  // Fetch bank accounts
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    setBankLoading(true);
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setBankAccounts(data);
    setBankLoading(false);
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        store_name: storeName,
        store_email: storeEmail,
        store_phone: storePhone,
        store_address: storeAddress,
        currency,
        free_shipping_threshold: freeShippingThreshold,
        standard_shipping_cost: standardShippingCost,
        express_shipping_cost: expressShippingCost,
        payments_enabled: paymentsEnabled,
        social_instagram: socialInstagram,
        social_facebook: socialFacebook,
        social_tiktok: socialTiktok,
        social_messenger: socialMessenger,
      });
      
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to save settings", 
        description: "Please try again.",
        variant: "destructive" 
      });
    }
  };

  const handleAddBank = async () => {
    if (!newBankName.trim() || !newIban.trim()) {
      toast({ title: "Please enter bank name and IBAN", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("bank_accounts").insert({
      bank_name: newBankName.trim(),
      iban: newIban.trim().toUpperCase(),
      display_order: bankAccounts.length,
    });
    if (error) {
      toast({ title: "Failed to add bank account", variant: "destructive" });
    } else {
      setNewBankName("");
      setNewIban("");
      fetchBankAccounts();
      toast({ title: "Bank account added" });
    }
  };

  const handleUpdateBank = async (id: string, updates: Partial<BankAccount>) => {
    const { error } = await supabase.from("bank_accounts").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      fetchBankAccounts();
    }
  };

  const handleDeleteBank = async (id: string) => {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      fetchBankAccounts();
      toast({ title: "Bank account removed" });
    }
  };

  const handleChangeOwnerEmail = async () => {
    if (!newOwnerEmail || !newOwnerEmail.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setChangingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-otp", {
        body: {
          actionType: "change_admin_email",
          actionPayload: { newEmail: newOwnerEmail.toLowerCase() },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setShowEmailOtpDialog(true);
      toast({
        title: "Verification code sent",
        description: "Check your current admin email for the 6-digit code.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) return;
    setEmailOtpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-otp", {
        body: { otpCode: emailOtpCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setShowEmailOtpDialog(false);
      setEmailOtpCode("");
      setNewOwnerEmail("");
      toast({
        title: "Admin email changed successfully",
        description: "The admin role has been transferred. You will be signed out.",
      });
      setTimeout(() => supabase.auth.signOut(), 2000);
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setEmailOtpLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Settings</h1>
          <p className="text-muted-foreground font-body mt-1">
            Manage your store configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="btn-gold inline-flex items-center gap-2"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Owner Account */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-foreground" />
          <h2 className="font-display text-xl text-foreground">Owner Account</h2>
        </div>

        <div>
          <label className="block text-sm font-body text-foreground mb-2">Current Email</label>
          <p className="text-muted-foreground font-body">{user?.email || "Not available"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">New Email Address</label>
            <input
              type="email"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              placeholder="Enter new email address"
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <button
              onClick={handleChangeOwnerEmail}
              disabled={changingEmail}
              className="btn-gold inline-flex items-center gap-2"
            >
              {changingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {changingEmail ? "Sending..." : "Change Email"}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A verification code will be sent to your current admin email. The new email must belong to an existing account.
        </p>
      </section>

      {/* Email Change OTP Dialog */}
      <Dialog open={showEmailOtpDialog} onOpenChange={setShowEmailOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              A 6-digit code was sent to your current admin email. Enter it below to confirm the email change.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <InputOTP maxLength={6} value={emailOtpCode} onChange={setEmailOtpCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={handleVerifyEmailOtp}
              disabled={emailOtpCode.length !== 6 || emailOtpLoading}
              className="w-full"
            >
              {emailOtpLoading ? "Verifying..." : "Verify & Change Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme - Link to dedicated page */}
      <section className="bg-card border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-foreground" />
            <div>
              <h2 className="font-display text-xl text-foreground">Store Theme</h2>
              <p className="text-sm text-muted-foreground mt-1">Customize your storefront's visual identity</p>
            </div>
          </div>
          <Link
            to="/admin/themes"
            className="btn-gold inline-flex items-center gap-2 text-xs"
          >
            <Palette className="w-4 h-4" />
            Open Theme Studio
          </Link>
        </div>
      </section>

      {/* Store Information */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-foreground" />
          <h2 className="font-display text-xl text-foreground">Store Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-foreground mb-2">Store Email</label>
            <input
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-foreground mb-2">Phone Number</label>
            <input
              type="text"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-foreground mb-2">Address</label>
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
        </div>
      </section>

      {/* Regional Settings */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-foreground" />
          <h2 className="font-display text-xl text-foreground">Regional Settings</h2>
        </div>

        <div>
          <label className="block text-sm font-body text-foreground mb-2">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body max-w-xs"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="GEL">GEL (₾)</option>
          </select>
        </div>
      </section>

      {/* Shipping Settings */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-foreground" />
          <h2 className="font-display text-xl text-foreground">Shipping</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Free Shipping Threshold (₾)
            </label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Standard Shipping (₾)
            </label>
            <input
              type="number"
              value={standardShippingCost}
              onChange={(e) => setStandardShippingCost(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Express Shipping (₾)
            </label>
            <input
              type="number"
              value={expressShippingCost}
              onChange={(e) => setExpressShippingCost(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
        </div>
      </section>

      {/* Payment Settings */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-foreground" />
          <h2 className="font-display text-xl text-foreground">Payments</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-foreground">Enable Payments</p>
            <p className="text-sm text-muted-foreground font-body">
              When disabled, customers will be directed to contact you via social media to purchase
            </p>
          </div>
          <Switch
            checked={paymentsEnabled}
            onCheckedChange={setPaymentsEnabled}
          />
        </div>

        {/* Bank Accounts */}
        {paymentsEnabled && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-display text-lg text-foreground">Bank Accounts</h3>
            
            {bankLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((bank) => (
                  <div key={bank.id} className="flex items-center gap-3 bg-background border border-border p-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={bank.bank_name}
                        onChange={(e) => handleUpdateBank(bank.id, { bank_name: e.target.value })}
                        className="px-3 py-2 bg-card border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body text-sm"
                        placeholder="Bank name"
                      />
                      <input
                        type="text"
                        value={bank.iban}
                        onChange={(e) => handleUpdateBank(bank.id, { iban: e.target.value.toUpperCase() })}
                        className="px-3 py-2 bg-card border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body text-sm font-mono"
                        placeholder="IBAN"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteBank(bank.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add new bank */}
                <div className="flex items-center gap-3 bg-background border border-dashed border-border p-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      className="px-3 py-2 bg-card border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body text-sm"
                      placeholder="Bank name"
                    />
                    <input
                      type="text"
                      value={newIban}
                      onChange={(e) => setNewIban(e.target.value.toUpperCase())}
                      className="px-3 py-2 bg-card border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body text-sm font-mono"
                      placeholder="IBAN"
                    />
                  </div>
                  <button
                    onClick={handleAddBank}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Media Links (shown when payments disabled) */}
        {!paymentsEnabled && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-foreground" />
              <h3 className="font-display text-lg text-foreground">Contact Channels</h3>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Add your social media links. Customers will see these when trying to buy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body text-foreground mb-2">Instagram</label>
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourstore"
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-foreground mb-2">Facebook</label>
                <input
                  type="text"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourstore"
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-foreground mb-2">TikTok</label>
                <input
                  type="text"
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@yourstore"
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-foreground mb-2">Messenger</label>
                <input
                  type="text"
                  value={socialMessenger}
                  onChange={(e) => setSocialMessenger(e.target.value)}
                  placeholder="https://m.me/yourstore"
                  className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSettings;
