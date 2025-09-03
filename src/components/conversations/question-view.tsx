import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuestionViewProps {
  topic: string;
  description: string;
  onUnderstand: () => void;
}

export const QuestionView = ({
  topic,
  description,
  onUnderstand,
}: QuestionViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/20">
          <CardContent id="step-1" className="p-8 space-y-8">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="px-3 py-1 text-sm">
                Question
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {topic}
              </h1>
              <p className="text-xl text-muted-foreground">{description}</p>
            </div>

            <div className="pt-6 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" className="px-8 py-6 text-lg" onClick={onUnderstand}>
                  I understand, let's start voting
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}; 