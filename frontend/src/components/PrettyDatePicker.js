import React, { useEffect, useMemo, useRef, useState } from 'react';

const pad2 = (n) => String(n).padStart(2, '0');
const toInputValue = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const formatHuman = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const PrettyDatePicker = ({ value, onChange, min, placeholder = 'mm/dd/yyyy', required }) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value).getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value).getMonth() : new Date().getMonth()));
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = (first.getDay() + 6) % 7; // start week on Monday
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const handleSelect = (date) => {
    if (!date) return;
    if (min && new Date(date) < new Date(min)) return;
    onChange && onChange(toInputValue(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '0.9rem',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: value ? '#111827' : '#9ca3af' }}>{value ? formatHuman(value) : placeholder}</span>
        <span role="img" aria-label="calendar">📅</span>
      </button>

      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            zIndex: 10,
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewYear(viewYear - 1);
                  setViewMonth(11);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              style={{ background: 'transparent', border: 0, fontSize: '1.25rem', cursor: 'pointer' }}
            >
              ⬆️
            </button>
            <div style={{ fontWeight: 700, color: '#111827' }}>
              {new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewYear(viewYear + 1);
                  setViewMonth(0);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              style={{ background: 'transparent', border: 0, fontSize: '1.25rem', cursor: 'pointer' }}
            >
              ⬇️
            </button>
          </div>

          <div style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6, color: '#6b7280', fontSize: 12, fontWeight: 600 }}>
              {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
                <div key={d} style={{ textAlign: 'center' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {days.map((d, idx) => {
                if (!d) return <div key={idx} />;
                const isToday = d.toDateString() === today.toDateString();
                const isSelected = value && new Date(value).toDateString() === d.toDateString();
                const isDisabled = min && new Date(d) < new Date(min);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(d)}
                    disabled={isDisabled}
                    style={{
                      padding: '0.5rem 0',
                      borderRadius: 8,
                      border: '1px solid ' + (isSelected ? '#667eea' : '#e5e7eb'),
                      background: isSelected ? '#eef2ff' : '#fff',
                      color: isDisabled ? '#9ca3af' : '#111827',
                      fontWeight: isToday ? 700 : 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button type="button" onClick={() => onChange && onChange('')} style={{ background: 'transparent', border: 0, color: '#6b7280', cursor: 'pointer' }}>Clear</button>
              <button type="button" onClick={() => handleSelect(new Date())} style={{ background: 'transparent', border: 0, color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Today</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden native input to keep forms/required/min semantics */}
      <input
        type="hidden"
        value={value || ''}
        required={required}
        min={min}
        onChange={() => {}}
        readOnly
      />
    </div>
  );
};

export default PrettyDatePicker;


