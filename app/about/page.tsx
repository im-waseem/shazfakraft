"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "100+", label: "Happy Customers" },
  { value: "120+", label: "Products Listed" },
  { value: "4.9★", label: "Average Rating" },
  { value: "48h", label: "Avg. Delivery" },
];

const values = [
  {
    icon: "✦",
    title: "Authentic Quality",
    desc: "Every product is handpicked and verified — from Islamic books to prayer essentials, we carry only what we trust ourselves.",
  },
  {
    icon: "◈",
    title: "Community First",
    desc: "Shazfa Kraftwas built by and for the Muslim community. Our roots are local, our vision is global.",
  },
  {
    icon: "⬡",
    title: "Ethical Commerce",
    desc: "We practice what we preach — fair pricing, halal sourcing, and honest dealings in every transaction.",
  },
  {
    icon: "◇",
    title: "Seamless Experience",
    desc: "From browsing to doorstep delivery, we make shopping for your deen as effortless as possible.",
  },
];

export default function AboutPage() {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: "#faf9f6",
        minHeight: "100vh",
        color: "#1a1714",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

        .about-hero-text {
          font-family: 'Playfair Display', Georgia, serif;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .about-hero-text.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .about-hero-text.delay-1 { transition-delay: 0.15s; }
        .about-hero-text.delay-2 { transition-delay: 0.30s; }
        .about-hero-text.delay-3 { transition-delay: 0.45s; }

        .stat-card {
          border: 1px solid #e0ddd7;
          padding: 2rem 1.5rem;
          background: #fff;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #b5965a;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }

        .value-card {
          padding: 2rem;
          border: 1px solid #e0ddd7;
          background: #fff;
          transition: all 0.25s ease;
        }
        .value-card:hover {
          background: #1a1714;
          color: #faf9f6;
          border-color: #1a1714;
        }
        .value-card:hover .value-icon {
          color: #b5965a;
        }
        .value-card:hover .value-desc {
          color: #c8c4bb;
        }

        .divider-line {
          width: 64px;
          height: 2px;
          background: #b5965a;
          margin: 1.25rem 0;
        }

        .team-img-wrap {
          overflow: hidden;
          position: relative;
        }
        .team-img-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid #b5965a;
          transform: translate(8px, 8px);
          pointer-events: none;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          background: "#1a1714",
          color: "#faf9f6",
          padding: "8rem 2rem 6rem",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(181,150,90,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(181,150,90,0.08) 0%, transparent 40%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 800,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p
            className={`about-hero-text ${visible ? "visible" : ""}`}
            style={{
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "0.22em",
              fontSize: "0.7rem",
              color: "#b5965a",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Our Story
          </p>
          <h1
            className={`about-hero-text delay-1 ${visible ? "visible" : ""}`}
            style={{
              fontSize: "clamp(2.6rem, 6vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "1.75rem",
            }}
          >
            Rooted in Faith.
            <br />
            <em style={{ fontStyle: "italic", color: "#b5965a" }}>
              Driven by Purpose.
            </em>
          </h1>
          <p
            className={`about-hero-text delay-2 ${visible ? "visible" : ""}`}
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 300,
              color: "#c8c4bb",
              lineHeight: 1.8,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Shazfa Kraftwas founded with a single belief — that every Muslim deserves
            access to quality, authentic products that enrich their daily
            worship and lifestyle.
          </p>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "5rem 2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1px",
            background: "#e0ddd7",
            border: "1px solid #e0ddd7",
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="stat-card" style={{ margin: 0 }}>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "2.8rem",
                  fontWeight: 700,
                  color: "#1a1714",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.8rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginTop: "0.5rem",
                  marginBottom: 0,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ─────────────────────────────────────── */}
      <section
        style={{
          background: "#fff",
          padding: "6rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          {/* Text */}
          <div>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                letterSpacing: "0.2em",
                fontSize: "0.68rem",
                color: "#b5965a",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Our Mission
            </p>
            <div className="divider-line" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                fontWeight: 600,
                lineHeight: 1.2,
                marginBottom: "1.5rem",
                marginTop: "1.5rem",
              }}
            >
              A marketplace built on Taqwa and trust.
            </h2>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "1rem",
                fontWeight: 300,
                lineHeight: 1.9,
                color: "#555",
                marginBottom: "1.25rem",
              }}
            >
              We started Shazfa Kraftfrom a small warehouse in Bangalore, inspired by
              a simple gap — finding high-quality Islamic products without
              compromise. Today we serve thousands of families across India.
            </p>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "1rem",
                fontWeight: 300,
                lineHeight: 1.9,
                color: "#555",
              }}
            >
              Every product on our platform is reviewed for authenticity,
              quality, and Shariah compliance. We do not list what we would not
              use ourselves.
            </p>
          </div>

          {/* Visual block */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                background: "#1a1714",
                padding: "3rem",
                color: "#faf9f6",
                position: "relative",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  width: 60,
                  height: 60,
                  border: "1px solid rgba(181,150,90,0.4)",
                  borderRadius: "50%",
                }}
              />
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  color: "#e8e4dc",
                  marginBottom: "1.5rem",
                }}
              >
                &ldquo;We wanted to build something that our community could
                rely on — not just for products, but for values.&rdquo;
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#b5965a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: "0.9rem",
                  }}
                >
                  SS
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    Syed Shaiz
                  </p>
                  <p
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontWeight: 300,
                      fontSize: "0.75rem",
                      color: "#b5965a",
                      margin: 0,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Founder, Syed Shaiz
                  </p>
                </div>
              </div>
            </div>
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: "-12px",
                right: "-12px",
                width: "100%",
                height: "100%",
                border: "1px solid #b5965a",
                zIndex: -1,
              }}
            />
          </div>
        </div>
      </section>

      {/* ── VALUES ─────────────────────────────────────── */}
      <section
        style={{
          background: "#faf9f6",
          padding: "6rem 2rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                letterSpacing: "0.2em",
                fontSize: "0.68rem",
                color: "#b5965a",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              What We Stand For
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontWeight: 600,
              }}
            >
              Our Core Values
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {values.map((v) => (
              <div key={v.title} className="value-card">
                <span
                  className="value-icon"
                  style={{
                    fontSize: "1.6rem",
                    color: "#b5965a",
                    display: "block",
                    marginBottom: "1rem",
                    transition: "color 0.25s",
                  }}
                >
                  {v.icon}
                </span>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                    transition: "color 0.25s",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  className="value-desc"
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 300,
                    lineHeight: 1.8,
                    color: "#666",
                    margin: 0,
                    transition: "color 0.25s",
                  }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}