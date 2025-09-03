"use client";

import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_TAGS } from "@/common/tags";
import Loading from "@/components/ui/loading";
import { isAdminUser } from "@/utils/adminCheck";

interface FormData {
  topic: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  seedComment: string;
  tags: string[];
  allowedEmails: string[];
  adminEmail: string | null;
}

export default function CreateConversationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const isAdmin = isAdminUser(session?.user?.email);

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    if (status === "authenticated" && !isAdmin) {
      router.replace("/home");
      return;
    }
  }, [status, isAdmin, router]);

  const form = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      topic: "",
      description: "",
      isActive: true,
      isPublic: true,
      seedComment: "",
      tags: [],
      allowedEmails: [],
      adminEmail: null,
    },
  });

  // Show loading while checking authentication
  if (status === "loading" || (status === "authenticated" && !isAdmin)) {
    return <Loading />;
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = form.getValues("tags");
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    form.setValue("tags", newTags);
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !form.getValues("tags").includes(customTag)) {
      form.setValue("tags", [...form.getValues("tags"), customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleAddEmail = () => {
    if (emailInput.trim()) {
      const currentEmails = form.getValues("allowedEmails") || [];
      if (!currentEmails.includes(emailInput.trim())) {
        form.setValue("allowedEmails", [...currentEmails, emailInput.trim()]);
        setEmailInput("");
      } else {
        toast.error("This email is already added");
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    const currentEmails = form.getValues("allowedEmails") || [];
    form.setValue(
      "allowedEmails",
      currentEmails.filter((e) => e !== email)
    );
  };

  const onSubmit = async (values: FormData) => {
    try {
      setIsLoading(true);

      // Validation
      if (!values.topic.trim() || values.topic.length < 2) {
        toast.error("Topic must be at least 2 characters long");
        return;
      }

      if (!values.description.trim() || values.description.length < 10) {
        toast.error("Description must be at least 10 characters long");
        return;
      }

      if (
        !values.isPublic &&
        (!values.allowedEmails || values.allowedEmails.length === 0)
      ) {
        toast.error("When conversation is private, you must specify at least one allowed email");
        return;
      }

      // Prepare the data to send
      const dataToSend = {
        ...values,
        seedComment: values.seedComment.trim() || null,
        adminEmail: values.adminEmail || process.env.NEXT_PUBLIC_SENDER_EMAIL || "admin@vayam.com",
      };

      const response = await axios.post(
        "/api/v1/conversations",
        dataToSend,
        {
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 400) {
        const errorMessages = Object.entries(
          response.data.errors?.fieldErrors || {}
        )
          .map(
            ([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`
          )
          .join("\n");
        throw new Error(errorMessages || response.data.message || "Validation failed");
      }

      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || "Failed to create conversation");
      }

      if (values.seedComment?.trim()) {
        try {
          const commentResponse = await axios.post("/api/v1/comments", {
            zid: response.data.data.zid,
            txt: values.seedComment.trim(),
          });

          if (!commentResponse.data.success) {
            console.error("Failed to add seed comment:", commentResponse.data);
            toast.error("Conversation created but failed to add seed comment.");
          }
        } catch (commentError) {
          console.error("Error adding seed comment:", commentError);
          toast.error("Conversation created but failed to add seed comment.");
        }
      }

      toast.success("Conversation created successfully!");
      form.reset();
      router.push("/home");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create conversation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isPublic = form.watch("isPublic");

  return (
    <div className="min-h-screen px-4 pt-2 sm:px-8 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/home")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Conversation</h1>
            <p className="text-muted-foreground mt-2">
              Start a meaningful discussion with your community
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card rounded-lg border p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Topic</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter conversation topic" 
                        {...field} 
                        className="text-lg py-3"
                      />
                    </FormControl>
                    <FormDescription>
                      What will this conversation be about?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed description"
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide more details about this conversation to help participants understand the context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Tags</FormLabel>
                    <FormDescription>
                      Select relevant tags to help users find this conversation.
                    </FormDescription>

                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-4 text-base font-medium">Available Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_TAGS.map((tag) => (
                            <Badge
                              key={tag}
                              variant={
                                field.value.includes(tag) ? "default" : "outline"
                              }
                              className={`cursor-pointer transition-all text-sm py-2 px-3 ${
                                field.value.includes(tag)
                                  ? "bg-primary hover:bg-primary/90"
                                  : "hover:bg-secondary"
                              }`}
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-4 text-base font-medium">Custom Tags</h3>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={customTag}
                            onChange={(e) => setCustomTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add your own tag"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            onClick={handleAddCustomTag}
                            disabled={!customTag.trim() || isLoading}
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {field.value
                            .filter((tag) => !AVAILABLE_TAGS.includes(tag))
                            .map((tag) => (
                              <Badge
                                key={tag}
                                variant="default"
                                className="cursor-pointer bg-primary hover:bg-primary/90 text-sm py-2 px-3"
                                onClick={() => handleTagToggle(tag)}
                              >
                                {tag}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seedComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Seed Comment (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add an initial comment to start the conversation"
                        className="min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      As an admin, you can add a seed comment to kickstart the
                      discussion and provide initial context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-6">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Active</FormLabel>
                        <FormDescription className="text-sm">
                          Should this conversation be active immediately?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-6">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Public</FormLabel>
                        <FormDescription className="text-sm">
                          Should this conversation be available to everyone?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {!isPublic && (
                <FormField
                  control={form.control}
                  name="allowedEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Allowed Emails</FormLabel>
                      <FormDescription>
                        Add emails of users who should have access to this
                        private conversation
                      </FormDescription>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddEmail();
                            }
                          }}
                          placeholder="Enter email address"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          onClick={handleAddEmail}
                          disabled={!emailInput.trim() || isLoading}
                          variant="outline"
                        >
                          Add Email
                        </Button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(field.value ?? []).map((email) => (
                          <Badge
                            key={email}
                            variant="default"
                            className="cursor-pointer bg-primary hover:bg-primary/90 text-sm py-2 px-3"
                          >
                            {email}
                            <X
                              className="ml-1 h-3 w-3"
                              onClick={() => handleRemoveEmail(email)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/home")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Conversation"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
