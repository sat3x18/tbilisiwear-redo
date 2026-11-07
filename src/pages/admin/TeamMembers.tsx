import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Shield, ShoppingCart, Package, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  email: string;
  permissions: {
    orders?: boolean;
    products?: boolean;
    full_access?: boolean;
  };
  status: string;
  created_at: string;
}

const PERMISSION_OPTIONS = [
  { key: "orders", label: "View Orders", icon: ShoppingCart, description: "Can view and manage orders" },
  { key: "products", label: "Manage Products", icon: Package, description: "Can add/edit products, categories, brands" },
  { key: "full_access", label: "Full Access", icon: Star, description: "Everything except team management" },
];

export default function TeamMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({
    orders: false,
    products: false,
    full_access: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching team members:", error);
    } else {
      setMembers((data || []).map(m => ({
        ...m,
        permissions: (m.permissions as TeamMember["permissions"]) || {},
      })));
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!newEmail) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    const hasPermission = Object.values(newPermissions).some(v => v);
    if (!hasPermission) {
      toast({ title: "Please select at least one permission before continuing", variant: "destructive" });
      return;
    }

    setAddLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-otp", {
        body: {
          actionType: "add_team_member",
          actionPayload: {
            email: newEmail.toLowerCase(),
            permissions: newPermissions,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setShowAddForm(false);
      setShowOtpDialog(true);
      toast({
        title: "Verification code sent",
        description: "Check the admin email for the 6-digit code.",
      });
    } catch (err: any) {
      const msg = err.message || "Failed to send verification code";
      toast({
        title: "Could not send code",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setOtpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-otp", {
        body: { otpCode },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setShowOtpDialog(false);
      setOtpCode("");
      setNewEmail("");
      setNewPermissions({ orders: false, products: false, full_access: false });
      toast({ title: "Team member added successfully" });
      fetchMembers();
    } catch (err: any) {
      const msg = err.message || "Invalid or expired code";
      const isIncorrect = msg.includes("Invalid") || msg.includes("expired");
      const isNoAccount = msg.includes("No registered account") || msg.includes("sign up first");
      toast({
        title: isNoAccount
          ? "No account found"
          : isIncorrect
          ? "Incorrect code"
          : "Verification failed",
        description: isNoAccount
          ? "No account found with that email. They need to sign up first."
          : isIncorrect
          ? "Incorrect code. Please check and try again."
          : msg,
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    const { error } = await supabase
      .from("admin_team_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to remove member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team member removed", description: "They no longer have access to the admin panel." });
      fetchMembers();
    }
  };

  const handleTogglePermission = async (member: TeamMember, key: string) => {
    const updated = { ...member.permissions, [key]: !member.permissions[key as keyof typeof member.permissions] };
    const { error } = await supabase
      .from("admin_team_members")
      .update({ permissions: updated })
      .eq("id", member.id);

    if (error) {
      toast({ title: "Failed to update permissions", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permissions updated" });
      fetchMembers();
    }
  };

  const getPermissionBadges = (permissions: TeamMember["permissions"]) => {
    if (permissions.full_access) return [<Badge key="full" variant="default">Full Access</Badge>];
    const badges = [];
    if (permissions.orders) badges.push(<Badge key="orders" variant="secondary">Orders</Badge>);
    if (permissions.products) badges.push(<Badge key="products" variant="secondary">Products</Badge>);
    return badges.length ? badges : [<Badge key="none" variant="outline">No permissions</Badge>];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display ">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage who has access to the admin panel</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Add Team Member</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="member-email">Email Address</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-3 mt-2">
                  {PERMISSION_OPTIONS.map(({ key, label, icon: Icon, description }) => (
                    <div key={key} className="flex items-start gap-3">
                      <Checkbox
                        checked={newPermissions[key] || false}
                        onCheckedChange={() =>
                          setNewPermissions(prev => ({ ...prev, [key]: !prev[key] }))
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleRequestOtp} disabled={addLoading} className="w-full">
                {addLoading ? "Sending verification..." : "Send Verification Code"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                A 6-digit code will be sent to your admin email for verification
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Team Members List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No team members yet</h3>
            <p className="text-sm text-muted-foreground">Add team members to give them access to the admin panel</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.email}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {getPermissionBadges(member.permissions)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {PERMISSION_OPTIONS.map(({ key, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={member.permissions[key as keyof typeof member.permissions] ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        title={`Toggle ${key}`}
                        onClick={() => handleTogglePermission(member, key)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              A 6-digit code was sent to your admin email. Enter it below to confirm adding the team member.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || otpLoading}
              className="w-full"
            >
              {otpLoading ? "Verifying..." : "Verify & Add Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
