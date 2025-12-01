"use client";

import { connectSocket, getSocket } from "@src/lib/socket";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: number;
  tempId?: number;
  from: string;
  to: string;
  message: string;
  timestamp: number;
  status?: "sent" | "delivered" | "saved" | "read";
}

export const useChat = (
  myId: string,
  otherUserId: string,
  chatEnabled: boolean
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);

  const isConnectedRef = useRef(false);
  const pendingReadsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!chatEnabled) return;

    const socket = connectSocket(myId);

    socket.on("connect", () => {
      isConnectedRef.current = true;

      // ✅ Flush queued reads (if offline during arrival)
      pendingReadsRef.current.forEach((id) => {
        socket.emit("private:read", { to: otherUserId, messageId: id });
      });
      pendingReadsRef.current.clear();
    });

    //----------------------------------------
    // ✅ RECEIVE MESSAGE (NO AUTO READ HERE)
    //----------------------------------------
    socket.on("private:message", (data) => {
      console.log("📩 RECEIVED message:", data);

      const msg: ChatMessage = {
        id: data.id,
        from: data.from,
        to: myId,
        message: data.message,
        timestamp: data.timestamp,
        status: "delivered",
      };

      setMessages((prev) => [...prev, msg]);

      // ❌ DO NOT AUTO-READ HERE
      // UI decides when to send read receipt
    });

    //----------------------------------------
    // ✅ MESSAGE SENT RESPONSE (replace tempId)
    //----------------------------------------
    socket.on("private:message:sent", (data) => {
      console.log("✅ SENT STATUS:", data);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.tempId === data.tempId) {
            return {
              ...msg,
              id: data.id,
              status: data.status,
            };
          }
          return msg;
        })
      );
    });

    //----------------------------------------
    // ✅ READ EVENT FROM SERVER
    //----------------------------------------
    socket.on("private:read", ({ messageId, from }) => {
      console.log("✅ READ EVENT RECEIVED:", messageId, "from", from);

      // Only mark my messages as read
      if (String(from) === String(otherUserId)) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: "read" } : m))
        );
      }
    });

    //----------------------------------------
    // ✅ TYPING
    //----------------------------------------
    socket.on("private:typing", (data) => {
      if (data.from === otherUserId) {
        setTyping(data.isTyping);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("private:message");
      socket.off("private:message:sent");
      socket.off("private:read");
      socket.off("private:typing");
    };
  }, [myId, otherUserId, chatEnabled]);

  //----------------------------------------
  // ✅ SEND READ RECEIPT (called by UI only)
  //----------------------------------------
  const markAsRead = useCallback(
    (messageId: number) => {
      const socket = getSocket();
      if (!socket) return;

      if (isConnectedRef.current) {
        socket.emit("private:read", { to: otherUserId, messageId });
      } else {
        pendingReadsRef.current.add(messageId);
      }
    },
    [otherUserId]
  );

  //----------------------------------------
  // ✅ SEND MESSAGE
  //----------------------------------------
  const sendMessage = useCallback(
    (text: string) => {
      const socket = getSocket();
      if (!socket) return;

      const tempId = Date.now();

      socket.emit("private:message", {
        to: otherUserId,
        message: text,
        tempId,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          tempId,
          from: myId,
          to: otherUserId,
          message: text,
          timestamp: Date.now(),
          status: "sent",
        },
      ]);
    },
    [myId, otherUserId]
  );

  //----------------------------------------
  // ✅ SEND TYPING
  //----------------------------------------
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const socket = getSocket();
      if (!socket) return;

      socket.emit("private:typing", { to: otherUserId, isTyping });
    },
    [otherUserId]
  );

  return {
    messages,
    typing,
    sendMessage,
    markAsRead,
    sendTyping,
  };
};
