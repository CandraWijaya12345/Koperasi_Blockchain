// styles/cards.js
export const cardStyles = {
  // stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
  },
  statIcon: {
    fontSize: '28px',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: '16px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },

  // generic card
  card: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '24px 24px 22px',
    marginBottom: '20px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
  },
  cardText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: 1.6,
  },

  input: {
    width: '100%',
    padding: '13px 14px',
    border: '1.8px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '15px',
    marginBottom: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '13px 20px',
    borderRadius: '999px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
  },

  // tabs
  tabs: {
    display: 'inline-flex',
    gap: '8px',
    backgroundColor: '#e5edff',
    padding: '6px',
    borderRadius: '999px',
    boxShadow: '0 8px 22px rgba(129,140,248,0.35)',
    marginBottom: '18px',
  },
  tab: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '9px 16px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#4b5563',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },

  infoBox: {
    backgroundColor: '#eff6ff',
    padding: '14px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
    textAlign: 'left',
    color: '#1d4ed8',
    fontSize: '14px',
  },

  // loan cards
  loanCard: {
    backgroundColor: '#f9fafb',
    padding: '18px',
    borderRadius: '14px',
    marginBottom: '18px',
    border: '1px dashed #d1d5db',
  },
  loanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  loanId: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111827',
  },
  loanStatus: {
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
  },
  loanDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  loanDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanDetailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  loanDetailValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
  },
  progressBar: {
    width: '100%',
    height: '7px',
    backgroundColor: '#e5e7eb',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg,#22c55e,#4ade80)',
    transition: 'width 0.3s',
  },

  refreshButton: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  historyContainer: {
    maxHeight: '460px',
    overflowY: 'auto',
  },
  emptyState: {
    textAlign: 'center',
    padding: '36px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },

  // admin pending list
  pendingList: {
    marginTop: '8px',
    maxHeight: '320px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  pendingItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '10px 12px',
    marginBottom: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  pendingItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '13px',
  },
  pendingStatusBadge: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(245,158,11,0.25)',
    color: '#fef3c7',
    fontWeight: 600,
  },
  pendingItemBody: {
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginBottom: '6px',
  },
  pendingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '6px',
  },
  pendingItemFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  pendingFillButton: {
    fontSize: '11px',
    padding: '5px 9px',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    color: '#4b5563',
    fontWeight: 600,
  },
};
