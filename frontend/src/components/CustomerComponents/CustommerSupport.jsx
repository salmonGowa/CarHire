import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LifeBuoy, PhoneCall, MessageSquare, AlertTriangle, 
  Ticket, ChevronRight, CheckCircle2, Clock, MapPin,
  Bot, Send, X, Sparkles, User
} from "lucide-react";
import { Table, Td, Tr } from "../Card";

// --- Mock Data ---
const TICKETS = [
  { id: "TKT-1042", subject: "Extend my current rental", date: "Oct 24, 2023", status: "Open", update: "2 hours ago" },
  { id: "TKT-0988", subject: "Question about insurance excess", date: "Sep 12, 2023", status: "Resolved", update: "1 month ago" },
];

const FAQS = [
  { q: "What happens if I return the car late?", a: "A grace period of 1 hour is provided. After that, late fees are calculated at 20% of the daily rate per hour." },
  { q: "Do I need to refill the fuel before returning?", a: "Yes, vehicles must be returned with the same fuel level as at pickup to avoid refueling surcharges." },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerSupport() {
  // --- Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Hello! I'm your DriveFleet AI assistant ✨ How can I help you today?" }
  ]);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isChatOpen]);

  // Handle AI Mock Responses
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now(), sender: "user", text: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and responding based on keywords
    setTimeout(() => {
      const lowerInput = userMsg.text.toLowerCase();
      let aiText = "I understand. I can connect you to a human support agent, or I can help you open a formal support ticket. Which would you prefer?";
      
      if (lowerInput.includes("extend") || lowerInput.includes("longer")) {
        aiText = "You can extend your current rental directly from your Active Trip dashboard! Would you like me to take you there?";
      } else if (lowerInput.includes("late") || lowerInput.includes("delay")) {
        aiText = "We offer a 1-hour grace period for late returns. After that, a 20% hourly fee applies based on your daily rate.";
      } else if (lowerInput.includes("insurance") || lowerInput.includes("accident")) {
        aiText = "Our standard insurance covers collisions with a $500 excess. If you're in an emergency, please use the red Roadside Assistance button on this page.";
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: aiText }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen">
      <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ── Header ── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Help & Support</h2>
            <p className="text-sm text-slate-500">We're here to ensure your journey is smooth and safe.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
            <MessageSquare className="w-5 h-5" /> Open New Ticket
          </button>
        </motion.div>

        {/* ── Emergency Action Banner ── */}
        <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <AlertTriangle className="absolute -left-10 -bottom-10 w-48 h-48 text-white/10 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
               <LifeBuoy className="w-8 h-8" />
             </div>
             <div>
               <h3 className="text-2xl font-black mb-1">Roadside Assistance</h3>
               <p className="text-rose-100 text-sm font-medium">In case of an accident or breakdown, our emergency team is available 24/7.</p>
             </div>
          </div>
          <button className="relative z-10 w-full md:w-auto px-8 py-4 bg-white text-rose-600 hover:bg-rose-50 rounded-2xl font-black uppercase tracking-widest transition-transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg">
            <PhoneCall className="w-5 h-5" /> Call Emergency
          </button>
        </motion.div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: FAQs & Contact */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Quick Answers</h3>
              <div className="space-y-4">
                {FAQS.map((faq, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">{faq.q}</p>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 pr-6">{faq.a}</p>
                    {i !== FAQS.length - 1 && <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 mt-4" />}
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                View All FAQs
              </button>
            </div>

            <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Dealership Location</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DriveFleet Pro Headquarters<br/>Waiyaki Way, Westlands<br/>Nairobi, Kenya</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Support Tickets */}
          <motion.div variants={itemVariants} className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm h-fit">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Ticket className="w-5 h-5 text-blue-500" /> Recent Support Tickets
               </h3>
            </div>
            
            <div className="overflow-x-auto">
             <Table heads={["Ticket ID", "Subject", "Last Updated", "Status"]}>
  {TICKETS.map((ticket) => (
    <Tr key={ticket.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
      <Td label="Ticket ID">
        <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 tracking-widest">
          {ticket.id}
        </span>
      </Td>
      
      <Td label="Subject" className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
        {ticket.subject}
      </Td>
      
      <Td label="Last Updated">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{ticket.date}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ticket.update}</span>
        </div>
      </Td>
      
      <Td label="Status" className="sm:text-right">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          ticket.status === 'Resolved' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
        }`}>
          {ticket.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {ticket.status}
        </span>
      </Td>
    </Tr>
  ))}
  
  {TICKETS.length === 0 && (
    <Tr>
      <Td colSpan="4" className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
        No support tickets found.
      </Td>
    </Tr>
  )}
</Table>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/*LIVE CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-[360px] h-[500px] mb-4 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-blue-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                      <Bot size={20} />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-black text-white leading-tight">DriveFleet AI</h3>
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Typically replies instantly</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-blue-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
                        <Sparkles size={12} />
                      </div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white rounded-br-sm" 
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>

                    {msg.sender === "user" && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 mb-1">
                        <User size={12} />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
                      <Sparkles size={12} />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-sm flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white dark:bg-[#0B1120] border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..." 
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsChatOpen(true)}
              className="group flex items-center gap-3 px-5 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl shadow-blue-500/20 hover:scale-105 transition-transform"
            >
              <div className="relative">
                <Bot size={24} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 dark:border-white rounded-full"></span>
              </div>
              <span className="font-black text-sm pr-1">Live Chat</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}