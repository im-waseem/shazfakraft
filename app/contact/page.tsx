"use client";

import { useState } from "react";

const contactInfo = [
  {
    icon: "◉",
    label: "Address",
    value: "Bangalore, Karnataka, India",
    sub: "Open for walk-ins by appointment",
  },
  {
    icon: "◎",
    label: "Email",
    value: "shazfakraft@gmail.com",
    sub: "We reply within 24 hours",
  },
  {
    icon: "◍",
    label: "WhatsApp",
    value: "+916361236653",
    sub: "9am – 9pm, Mon – Sat",
  },
];

const faqs = [
  {
    q: "Do you ship across India?",
    a: "Yes, we ship pan-India. Most orders arrive within 3–5 business days.",
  },
  {
    q: "Are your products Shariah-compliant?",
    a: "Every product is reviewed before listing. We source from trusted suppliers only.",
  },
  {
    q: "How do I track my order?",
    a: "Once shipped, you'll receive an SMS and email with tracking details.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days for damaged or incorrect items.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main
      style={{
        fontFamily: "'Georgia', serif",
        background: "#faf9f6",
        minHeight: "100vh",
        color: "#1a1714",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

        .contact-input {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1px solid #ddd9d2;
          background: #fff;
          font-family: 'Lato', sans-serif;
          font-size: 0.9rem;
          color: #1a1714;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          border-radius: 0;
          appearance: none;
        }
        .contact-input:focus {
          border-color: #b5965a;
          box-shadow: 0 0 0 3px rgba(181,150,90,0.12);
        }

        .contact-btn {
          background: #1a1714;
          color: #faf9f6;
          border: none;
          padding: 1rem 2.5rem;
          font-family: 'Lato', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          width: 100%;
        }
        .contact-btn:hover {
          background: #b5965a;
        }
        .contact-btn:active {
          transform: scale(0.98);
        }
        .contact-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-card {
          padding: 1.75rem;
          background: #fff;
          border: 1px solid #e0ddd7;
          transition: border-color 0.2s;
        }
        .info-card:hover {
          border-color: #b5965a;
        }

        .faq-item {
          border-bottom: 1px solid #e0ddd7;
        }
        .faq-btn {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          padding: 1.25rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          color: #1a1714;
        }
        .faq-btn:hover {
          color: #b5965a;
        }
        .faq-answer {
          font-family: 'Lato', sans-serif;
          font-size: 0.9rem;
          line-height: 1.8;
          color: #666;
          font-weight: 300;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        .faq-answer.open {
          padding-bottom: 1.25rem;
        }

        .gold-bar {
          width: 48px;
          height: 2px;
          background: #b5965a;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────── */}
      <section
        style={{
          background: "#1a1714",
          padding: "7rem 2rem 5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse at 50% 100%, rgba(181,150,90,0.15) 0%, transparent 60%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "0.22em",
              fontSize: "0.68rem",
              color: "#b5965a",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            Get In Touch
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 600,
              color: "#faf9f6",
              lineHeight: 1.15,
              marginBottom: "1.25rem",
              letterSpacing: "-0.01em",
            }}
          >
            We&apos;d Love to{" "}
            <em style={{ fontStyle: "italic", color: "#b5965a" }}>Hear</em>
            <br />
            From You
          </h1>
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "1rem",
              fontWeight: 300,
              color: "#a09990",
              lineHeight: 1.8,
            }}
          >
            Questions, feedback, or just saying salaam — our team is here and
            ready to help.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ─────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginBottom: "5rem",
          }}
        >
          {contactInfo.map((c) => (
            <div key={c.label} className="info-card">
              <span
                style={{
                  fontSize: "1.4rem",
                  color: "#b5965a",
                  display: "block",
                  marginBottom: "1rem",
                }}
              >
                {c.icon}
              </span>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#999",
                  marginBottom: "0.35rem",
                }}
              >
                {c.label}
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "#1a1714",
                }}
              >
                {c.value}
              </p>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 300,
                  color: "#999",
                  margin: 0,
                }}
              >
                {c.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── FORM + FAQ GRID ─────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* FORM */}
          <div>
            <div className="gold-bar" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.9rem",
                fontWeight: 600,
                marginBottom: "2rem",
              }}
            >
              Send Us a Message
            </h2>

            {submitted ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #b5965a",
                  padding: "3rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    color: "#b5965a",
                  }}
                >
                  ✓
                </p>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.3rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Message received!
                </p>
                <p
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 300,
                    color: "#888",
                  }}
                >
                  JazakAllah khair. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  }}
                  style={{
                    marginTop: "1.5rem",
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    background: "none",
                    border: "1px solid #1a1714",
                    padding: "0.6rem 1.5rem",
                    cursor: "pointer",
                    color: "#1a1714",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background =
                      "#1a1714";
                    (e.target as HTMLButtonElement).style.color = "#faf9f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = "none";
                    (e.target as HTMLButtonElement).style.color = "#1a1714";
                  }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontFamily: "'Lato', sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "#999",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Full Name *
                    </label>
                    <input
                      className="contact-input"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Lato', sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "#999",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Email *
                    </label>
                    <input
                      className="contact-input"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Subject
                  </label>
                  <select
                    className="contact-input"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      border: "1px solid #ddd9d2",
                      background: "#fff",
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "0.9rem",
                      color: form.subject ? "#1a1714" : "#aaa",
                      outline: "none",
                      borderRadius: 0,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select a topic…</option>
                    <option value="order">Order inquiry</option>
                    <option value="product">Product question</option>
                    <option value="return">Returns &amp; refunds</option>
                    <option value="wholesale">Wholesale / bulk</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    className="contact-input"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    style={{ resize: "vertical" }}
                  />
                </div>

                <button className="contact-btn" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <div className="gold-bar" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.9rem",
                fontWeight: 600,
                marginBottom: "2rem",
              }}
            >
              Frequently Asked
            </h2>
            <div>
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button
                    className="faq-btn"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <span
                      style={{
                        color: "#b5965a",
                        fontSize: "1.2rem",
                        lineHeight: 1,
                        transform:
                          openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.25s",
                        display: "inline-block",
                        flexShrink: 0,
                        marginLeft: "1rem",
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`faq-answer ${openFaq === i ? "open" : ""}`}
                    style={{
                      maxHeight: openFaq === i ? "200px" : "0",
                    }}
                  >
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div
              style={{
                marginTop: "3rem",
                background: "#1a1714",
                padding: "2.5rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, rgba(181,150,90,0.15) 0%, transparent 50%)",
                }}
              />
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#b5965a",
                  marginBottom: "0.75rem",
                }}
              >
                Based In
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  color: "#faf9f6",
                  marginBottom: "0.5rem",
                }}
              >
                Bangalore, India
              </p>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 300,
                  color: "#888",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Serving 
                <br />
                across India since 2025.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}