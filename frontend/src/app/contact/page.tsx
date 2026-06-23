'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

function ContactItem({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="border border-hairline bg-surface p-3 shrink-0 text-accent rounded-xl">
                {icon}
            </div>
            <div>
                <p className="eyebrow mb-1">{title}</p>
                <span className="font-mono text-sm text-ink">{content}</span>
            </div>
        </div>
    );
}

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const inputClass = "w-full bg-background border border-hairline text-ink placeholder:text-muted px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none transition-colors rounded-xl";
    const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted mb-2 block";

    return (
        <main className="min-h-screen bg-background text-ink px-5 py-16 sm:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Info */}
                    <div>
                        <p className="eyebrow mb-4">get in touch</p>
                        <h1 className="font-display text-4xl font-semibold text-ink mb-5">Contact Us</h1>
                        <p className="font-mono text-sm text-muted leading-relaxed mb-12">
                            Have questions about our institutional API? Need a custom integration? We&apos;re here to help.
                        </p>

                        <div className="space-y-6 mb-10">
                            <ContactItem icon={<Mail className="w-5 h-5" />} title="Email Us"  content="institutional@metis.finance" />
                            <ContactItem icon={<Phone className="w-5 h-5" />} title="Call Us"   content="+1 (555) 123-4567" />
                            <ContactItem icon={<MapPin className="w-5 h-5" />} title="Visit Us" content="101 Quant Way, Wall Street, NY 10005" />
                        </div>

                        <div className="border-l-2 border-accent bg-surface/60 px-6 py-5">
                            <p className="eyebrow mb-2">support hours</p>
                            <p className="font-mono text-sm text-ink">Monday – Friday: 8am – 6pm EST</p>
                            <p className="font-mono text-xs text-muted mt-1">24/7 dedicated support for Enterprise clients.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="border border-hairline bg-surface p-8 rounded-[1.75rem] shadow-xl">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-16">
                                <div className="border border-approve/30 bg-approve/5 p-5 mb-6 text-approve rounded-2xl">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="font-display text-2xl font-semibold text-ink mb-2">Message Sent.</h3>
                                <p className="font-mono text-xs text-muted mb-8">Our team will respond within 24 hours.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="font-mono text-xs text-accent hover:underline underline-offset-4"
                                >
                                    Send another message →
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>First Name</label>
                                        <input type="text" className={inputClass} placeholder="John" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last Name</label>
                                        <input type="text" className={inputClass} placeholder="Doe" required />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Work Email</label>
                                    <input type="email" className={inputClass} placeholder="name@company.com" required />
                                </div>

                                <div>
                                    <label className={labelClass}>Subject</label>
                                    <select className={inputClass}>
                                        <option>Enterprise Licensing</option>
                                        <option>Technical Support</option>
                                        <option>Partnership Inquiry</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Message</label>
                                    <textarea rows={4} className={`${inputClass} resize-none rounded-2xl`} placeholder="How can we help?" required />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full font-mono bg-ink text-background py-3.5 text-sm font-semibold transition-colors hover:bg-accent rounded-full shadow-md"
                                >
                                    Send Message →
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
