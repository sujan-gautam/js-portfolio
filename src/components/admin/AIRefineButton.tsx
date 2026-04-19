import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE } from "@/config";
import { toast } from "sonner";

interface AIRefineButtonProps {
  value: string;
  onRefine: (refined: string) => void;
  context: string;
}

export const AIRefineButton = ({ value, onRefine, context }: AIRefineButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    if (!value || value.trim().length < 10) {
      return toast.info("Please enter at least a few words to refine.");
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/utils/refine-content`, {
        text: value,
        context
      });
      
      if (res.data.refined) {
        onRefine(res.data.refined);
        toast.success("Content refined successfully!");
      }
    } catch (error) {
      console.error("AI Refine Error:", error);
      toast.error("Failed to refine content with AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRefine}
      disabled={loading}
      className="h-8 gap-2 text-xs font-semibold border-slate-200 hover:bg-slate-50 transition-all text-[#CB2729] hover:text-[#b02224]"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Sparkles size={14} />
      )}
      Refine with AI
    </Button>
  );
};
