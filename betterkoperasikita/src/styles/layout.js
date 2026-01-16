// styles/layout.js
export const layoutStyles = {
  pageWrapper: {
    minHeight: '100vh',
    background:
      'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)',
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '36px 24px 40px',
    flex: 1,
    width: '100%',
  },
  messageWrapper: {
    maxWidth: '1200px',
    margin: '16px auto 0',
    padding: '0 24px',
  },
  messageBanner: {
    padding: '12px 18px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: 500,
  },

  // HERO (landing)
  heroSection: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
    alignItems: 'center',
    gap: '48px',
    padding: '24px 0 40px',
  },
  heroText: {
    maxWidth: '540px',
  },
  heroTitle: {
    fontSize: '44px',
    lineHeight: 1.15,
    fontWeight: 800,
    color: '#1f2937',
    margin: '0 0 20px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: 1.7,
    maxWidth: '420px',
    marginBottom: '28px',
  },
  heroButton: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '999px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 12px 30px rgba(37,99,235,0.4)',
    width: 'fit-content',
  },
  heroImageWrapper: {
    justifySelf: 'end',
    maxWidth: '650px',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    display: 'block',
    borderRadius: '32px',
    boxShadow: '0 25px 60px rgba(15,23,42,0.25)',
    objectFit: 'cover',
  },

  // info cards row
  infoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: '20px',
    marginTop: '10px',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '20px 22px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  },
  infoTitle: {
    margin: '0 0 8px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#6b7280',
  },

  // dashboard hero
  dashboardHero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)',
    gap: '32px',
    marginBottom: '28px',
    alignItems: 'center',
  },
  dashboardHeroLeft: {
    maxWidth: '560px',
  },
  dashboardLabel: {
    margin: 0,
    fontSize: '14px',
    color: '#2563eb',
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dashboardTitle: {
    margin: '8px 0 10px',
    fontSize: '30px',
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.25,
  },
  dashboardSubtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: 1.7,
  },
  dashboardHeroRight: {
    justifySelf: 'end',
    maxWidth: '320px',
    width: '100%',
    padding: '18px 18px 20px',
    borderRadius: '24px',
    background:
      'radial-gradient(circle at 0 0,#bfdbfe,transparent 55%),radial-gradient(circle at 100% 100%,#93c5fd,transparent 55%)',
    boxShadow: '0 20px 45px rgba(15,23,42,0.18)',
  },
  dashboardBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.85)',
    color: '#e5e7eb',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  dashboardHeroBubble: {
    borderRadius: '18px',
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: '14px 14px',
    fontSize: '14px',
    color: '#111827',
    lineHeight: 1.5,
  },

  sectionTitle: {
    margin: '24px 0 12px',
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
  },

  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#6b7280',
    fontSize: '13px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  },
};
