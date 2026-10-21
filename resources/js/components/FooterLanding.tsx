import React from 'react';
import { type Variants, motion } from 'framer-motion';

import { FaFacebook, FaLinkedin, FaPhone, FaTwitter, FaYoutubeSquare } from 'react-icons/fa';
import { Mail, MapPin, Phone } from 'lucide-react';

const FooterLanding = () => {
  const FOOTER_COLS = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'] },
    { title: 'Solutions', links: ['Individual Dealers', 'Fleet Networks', 'Corporate', 'Tourism Ops', 'Driver Partners'] },
    { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press Kit', 'Contact'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'KRA Compliance'] },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const socialIcons = [
    { icon: <FaTwitter size={16} strokeWidth={2} />, label: 'X (Twitter)' },
    { icon: <FaLinkedin size={16} strokeWidth={2} />, label: 'LinkedIn' },
    { icon: <FaPhone size={16} strokeWidth={2} />, label: 'WhatsApp' }, 
    { icon: <FaYoutubeSquare size={16} strokeWidth={2} />, label: 'YouTube' },
    { icon: <FaFacebook size={16} strokeWidth={2} />, label: 'Facebook' },
  ];

  return (
    <footer id="footer" className="bg-slate-50 dark:bg-[#020508] border-t border-slate-200 dark:border-white/[0.04] overflow-hidden">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-14">
          
          {/* Brand & Contact Column */}
          <motion.div variants={itemVariants} className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-18 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg text-white shadow-md"><img src="/logo.png" alt="DriveFleet Pro" className="w-full h-full object-cover" /></div>
              <span className="font-display font-bold text-[16px] text-slate-900 dark:text-white">
                DriveFleet
              </span>
            </div>
            <p className="text-slate-600 dark:text-white/40 text-[13px] leading-relaxed mb-6 max-w-[240px]">
              The <span className="font-bold bg-gradient-to-r from-blue-500 to-violet-500 text-transparent bg-clip-text">ULTIMATE</span> multi-dealer car hire management platform built for East Africa.
            </p>
            
            {/* Socials */}
            <div className="flex gap-2 mb-7 flex-wrap">
              {socialIcons.map((social, idx) => (
                <button 
                  key={idx} 
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-blue-600/20 hover:border-slate-300 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center shadow-sm dark:shadow-none group"
                >
                  <span className="group-hover:scale-110 transition-transform duration-300">
                    {social.icon}
                  </span>
                </button>
              ))}
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-white/40 text-[13px] flex items-center gap-3">
                <MapPin size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" /> 
                Nairobi, Kenya
              </p>
              <p className="text-slate-500 dark:text-white/40 text-[13px] flex items-center gap-3">
                <Phone size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" /> 
                +254 700 123 456
              </p>
              <p className="text-slate-500 dark:text-white/40 text-[13px] flex items-center gap-3">
                <Mail size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" /> 
                info@drivefleet.com
              </p>
            </div>
          </motion.div>

          {/* Links Columns */}
          {FOOTER_COLS.map((col, i) => (
            <motion.div variants={itemVariants} key={i}>
              <h4 className="font-display font-bold text-[11px] text-slate-800 dark:text-white/60 uppercase tracking-widest mb-5">
                {col.title}
              </h4>
              <div className="space-y-3">
                {col.links.map((link, j) => (
                  <p key={j}>
                    <button className="text-slate-500 dark:text-white/40 text-[13px] hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">
                      {link}
                    </button>
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div variants={itemVariants} className="border-t border-slate-200 dark:border-white/[0.06] pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-white/30 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} DriveFleet Pro Ltd. Registered in Kenya. All rights reserved.
          </p>
          
          {/* Trust/Payment Badges */}
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="text-slate-600 font-semibold dark:text-white/50 text-[11px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-md shadow-sm dark:shadow-none flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> M-PESA
            </span>
            <span className="text-slate-600 font-semibold dark:text-white/50 text-[11px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-md shadow-sm dark:shadow-none">
              Visa
            </span>
            <span className="text-slate-600 font-semibold dark:text-white/50 text-[11px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-md shadow-sm dark:shadow-none">
              Mastercard
            </span>
          </div>
        </motion.div>

      </motion.div>
    </footer>
  );
}

export default FooterLanding;