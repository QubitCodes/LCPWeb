"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@src/components/ui/popover";
import { useChat } from "@src/hooks/useChat";
import { cn } from "@src/lib/utils";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function ChatInterface() {
  const [otherUserId, setotherUserId] = useState<string>("12");
  const [myUserId, setmyUserId] = useState<string>("13");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);

  const { messages, sendMessage, typing, sendTyping, markAsRead } = useChat(
    myUserId,
    otherUserId,
    chatEnabled
  );

  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    const handleRead = () => {
      const chatVisible = isChatOpen && document.visibilityState === "visible";

      if (!chatVisible) return;

      messages.forEach((msg) => {
        const isIncoming = msg.from !== myUserId;
        const notRead = msg.status !== "read";

        if (isIncoming && notRead) {
          markAsRead(msg.id);
        }
      });
    };

    handleRead();

    document.addEventListener("visibilitychange", handleRead);

    return () => {
      document.removeEventListener("visibilitychange", handleRead);
    };
  }, [messages, isChatOpen, myUserId, markAsRead]);

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    // Assuming sendMessage can handle a file. You might need to adjust your useChat hook.
    sendMessage(text);
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiData.emoji) {
      setText((prevText) => prevText + emojiData.emoji);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-110">
          <MessageSquare />
        </button>
      )}

      {isChatOpen && (
        <div className="flex flex-col h-[600px] w-96 max-w-4xl mx-auto border rounded-lg shadow-xl bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background rounded-t-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>

              <div>
                <h2 className="font-semibold text-sm">John Doe</h2>
                <p className="text-xs text-muted-foreground">
                  {typing ? "Typing..." : "Online"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Video />
              </Button>
              <Button variant="ghost" size="icon">
                <Phone />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ✅ Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-muted/20">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.from === myUserId ? "justify-end" : "justify-start"
                )}>
                <div
                  className={cn(
                    "max-w-[70%] px-3 py-2 shadow-sm",
                    m.from === myUserId
                      ? "bg-primary text-primary-foreground rounded-l-lg rounded-br-lg"
                      : "bg-background border rounded-r-lg rounded-bl-lg"
                  )}>
                  <p className="text-sm break-words">{m.message}</p>

                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 mt-1 text-xs",
                      m.from === myUserId
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}>
                    <span>{formatTime(m.timestamp)}</span>

                    {/* ✅ STATUS */}
                    {m.from === myUserId && (
                      <span>
                        {m.status === "sent" && "✓"}
                        {m.status === "delivered" && "✓✓"}
                        {m.status === "saved" && "✓✓"}
                        {m.status === "read" && (
                          <span className="text-blue-400">✓✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Input */}
          <div className="border-t bg-background px-4 py-3 rounded-b-lg flex flex-col">
            {attachedFile && (
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-2">
                <p className="text-sm text-muted-foreground truncate">
                  {attachedFile.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAttachedFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex items-center">
                <Popover
                  open={showEmojiPicker}
                  onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Smile />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-0 mb-2">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}>
                  <Paperclip />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <Input
                value={text}
                className="border border-sidebar"
                onChange={(e) => {
                  setText(e.target.value);
                  sendTyping(true);
                  setTimeout(() => sendTyping(false), 1000);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message"
              />

              <Button
                size="icon"
                onClick={handleSend}
                disabled={!text.trim() && !attachedFile}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
