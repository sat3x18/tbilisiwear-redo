import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Loader2, Camera, Trash2, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ScrollReveal from "@/components/ScrollReveal";
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

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut, resetPassword } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  // Sync state when profile loads asynchronously
  useEffect(() => {
    if (profile) {
      setDisplayName(prev => prev || profile.display_name || "");
      setPhone(prev => prev || profile.phone || "");
    }
  }, [profile]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      display_name: displayName,
      phone: phone || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }

    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    const { error } = await updateProfile({ avatar_url: null });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove avatar",
        variant: "destructive",
      });
    } else {
      toast({ title: "Avatar removed" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);

    try {
      // Call the edge function to delete account
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw error;
      }

      // Sign out locally
      await signOut();

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }

    setDeletingAccount(false);
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    const { error } = await resetPassword(user.email);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent",
        description: "Check your email for a password reset link.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl text-foreground">Profile Settings</h2>

      {/* Avatar Section */}
      <div className="bg-card border border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center relative overflow-hidden">
            {uploadingAvatar ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 px-4 py-2 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Change Photo
              </button>
              {profile?.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground font-body text-sm hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-body">
              JPG, PNG or GIF. Max 2MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-card border border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-6">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-muted-foreground font-body cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-body">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
                placeholder="+995 XXX XXX XXX"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 btn-gold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      {/* Security */}
      <div className="bg-card border border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Security</h3>
        <p className="text-muted-foreground font-body text-sm mb-4">
          Manage your password and security settings.
        </p>
        <button
          onClick={handleChangePassword}
          className="px-6 py-3 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors"
        >
          Change Password
        </button>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-foreground font-body">Email Notifications</p>
              <p className="text-sm text-muted-foreground font-body">
                Receive updates about orders and promotions
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                emailNotifications ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute left-1 top-1 w-4 h-4 bg-foreground rounded-full transition-transform ${
                  emailNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-foreground font-body">SMS Notifications</p>
              <p className="text-sm text-muted-foreground font-body">
                Get order updates via SMS
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smsNotifications}
              onClick={() => setSmsNotifications(!smsNotifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                smsNotifications ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute left-1 top-1 w-4 h-4 bg-foreground rounded-full transition-transform ${
                  smsNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Admin Portal */}
      {isAdmin && (
        <ScrollReveal direction="up" delay={0.1}>
          <div className="border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="mb-1 font-display text-lg text-foreground">Administration</h3>
                <p className="mb-4 font-body text-sm text-muted-foreground">
                  Manage products, orders and store settings
                </p>
                <button
                  onClick={() => navigate("/admin")}
                  className="btn-gold group gap-2"
                >
                  Open admin panel
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 p-6">
        <h3 className="font-display text-lg text-destructive mb-2">Danger Zone</h3>
        <p className="text-muted-foreground font-body text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="px-6 py-3 bg-destructive/10 border border-destructive text-destructive font-body text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors">
              Delete Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-foreground">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="font-body text-muted-foreground">
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-foreground hover:bg-secondary">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingAccount ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Settings;
