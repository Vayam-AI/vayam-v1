import {
  BarChart2,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import { CreateConversation } from "./create-conversation";
import { Button } from "../ui/button";

export const NoConversations = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col justify-center items-center h-[80vh] gap-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          No conversations yet
        </h2>
        <p className="text-muted-foreground">
          Get started by creating your first conversation. Share ideas, gather
          feedback, and engage with your community.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <CreateConversation />
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-center mb-2 gap-3">
            <Lightbulb className="h-5 w-5 mb-2 text-primary" />
            <h3 className=" mb-1 text-foreground font-bold">
              Start Discussions
            </h3>
          </div>

          <p>Create topics that matter to your audience</p>
        </div>
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-center mb-2 gap-3">
            <Users className="h-5 w-5 mb-2 text-primary" />
            <h3 className="font-bold mb-1 text-foreground">Engage Users</h3>
          </div>
          <p>Foster meaningful conversations</p>
        </div>
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-center mb-2 gap-3">
            <BarChart2 className="h-5 w-5 mb-2 text-primary" />
            <h3 className="font-bold mb-1 text-foreground">Gain Insights</h3>
          </div>
          <p>Understand what resonates with your community</p>
        </div>
      </div>
    </div>
  );
};
