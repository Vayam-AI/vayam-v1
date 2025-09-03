"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { conversationSchema, ConversationsSchema } from "@/common/conversationValidations";
import { AVAILABLE_TAGS } from "@/common/tags";


type FormData = ConversationsSchema;

export const CreateConversation = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    // Dialog state changed
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(conversationSchema),
    mode: "onChange",
    defaultValues: {
      topic: "",
      description: "",
      isActive: true,
      isPublic: true,
      seedComment: null,
      tags: [],
      allowedEmails: [],
      adminEmail: null,
    },
  });

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

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    try {
      setIsLoading(true);
      if (
        !values.isPublic &&
        (!values.allowedEmails || values.allowedEmails.length === 0)
      ) {
        toast.error("When conversation is private, you must specify at least one allowed email");
        setIsLoading(false);
        return;
      }

      // Prepare the data to send
      const dataToSend = {
        ...values,
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
      setOpen(false);
      window.location.reload();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="rounded-full" 
          variant="default" 
          size="lg"
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter conversation topic" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed description"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide more details about this conversation.
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
                  <FormLabel>Tags</FormLabel>
                  <FormDescription>
                    Select relevant tags to help users find this conversation.
                  </FormDescription>

                  <div className="mb-8">
                    <h2 className="mb-4 text-lg font-medium">Available Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={
                            field.value.includes(tag) ? "default" : "outline"
                          }
                          className={`cursor-pointer transition-all ${
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

                  <div className="mb-8">
                    <h2 className="mb-4 text-lg font-medium">Custom Tags</h2>
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
                            className="cursor-pointer bg-primary hover:bg-primary/90"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
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
                  <FormLabel>Seed Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add an initial comment to start the conversation"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    As an admin, you can add a seed comment to kickstart the
                    discussion.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
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
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public</FormLabel>
                      <FormDescription>
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
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowedEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed Emails</FormLabel>
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
                        >
                          Add Email
                        </Button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(field.value ?? []).map((email) => (
                          <Badge
                            key={email}
                            variant="default"
                            className="cursor-pointer bg-primary hover:bg-primary/90"
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
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Conversation"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};