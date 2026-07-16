// Frontend/src/components/admin/MessageUserModal.jsx
import { useState } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../Toast";

// Small modal that lets the admin fire off a one-off notification/message
// to a seller or customer, e.g. "Please re-schedule your pickup" or
// "Your bank details look incomplete". Delivered via the same notification
// system as everything else (shows up in their bell + gets emailed nowhere,
// just in-app), so no separate chat infra is needed.
export default function MessageUserModal({ user, onClose }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please write a message first");
      return;
    }
    try {
      setSending(true);
      await api.post(`/admin/users/${user._id}/message`, { title, message });
      toast.success(`Message sent to ${user.name}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-ink/20 border border-mint-line w-full max-w-md p-5 animate-toast-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-ink text-base leading-tight">
                Message {user.name}
              </h3>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1 -mr-1 -mt-1 rounded-lg hover:bg-mint transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink/70 mb-1 block">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Message from Admin"
              className="w-full px-3.5 py-2.5 rounded-xl border border-mint-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/70 mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-mint-line text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-forest/30"
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-mint-line text-ink font-semibold text-sm hover:bg-mint transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-2.5 rounded-full btn-brand text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <Send size={15} />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
