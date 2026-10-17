'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getTomorrowJalali, getCurrentPollDate, getDayKey } from '../lib/dates'
import './globals.css'

export default function Home() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('hellokitty')

  // فرم‌ها
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [classCode, setClassCode] = useState('')
  const [error, setError] = useState('')

  // داده‌های صفحه اصلی
  const [announcements, setAnnouncements] = useState([])
  const [votes, setVotes] = useState([])
  const [messages, setMessages] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [myVote, setMyVote] = useState(null)

  useEffect(() => {
    // تم ذخیره شده
    const savedTheme = localStorage.getItem('theme') || 'hellokitty'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // بررسی سشن
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && profile) {
      loadAnnouncements()
      loadVotes()
      loadMessages()
    }
  }, [session, profile])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(username, is_owner, is_admin)')
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  async function loadVotes() {
    const pollDate = getCurrentPollDate()
    const { data } = await supabase
      .from('poll_votes')
      .select('*, profiles(username)')
      .eq('poll_date', pollDate)
    setVotes(data || [])
    if (profile) {
      const mine = data?.find(v => v.user_id === profile.id)
      setMyVote(mine ? mine.vote : null)
    }
  }

  async function loadMessages() {
    const dayKey = getDayKey()
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username, is_owner, is_admin)')
      .eq('day_key', dayKey)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  function toggleTheme() {
    const next = theme === 'hellokitty' ? 'batman' : 'hellokitty'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setError('')

    if (classCode !== 'tak301') {
      setError('فقط دانش آموزان کلاس 301 می‌توانند وارد شوند، فضول نباشید!')
      return
    }

    const cleanUsername = username.trim()
    if (!cleanUsername || !password) {
      setError('اسم و رمز را وارد کنید')
      return
    }

    const fakeEmail = `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@301tajrobiroom.local`

    if (isLogin) {
      // ورود
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password
      })
      if (error) setError('اسم یا رمز اشتباه است')
    } else {
      // ثبت‌نام
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: { username: cleanUsername }
        }
      })
      if (error) {
        setError(error.message.includes('already') ? 'این اسم قبلاً ثبت شده' : error.message)
        return
      }
      // ساخت پروفایل
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: cleanUsername,
          is_owner: false,
          is_admin: false
        })
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function submitVote(vote) {
    if (!profile) return
    const pollDate = getCurrentPollDate()
    
    if (myVote) {
      // آپدیت
      await supabase
        .from('poll_votes')
        .update({ vote })
        .eq('user_id', profile.id)
        .eq('poll_date', pollDate)
    } else {
      // جدید
      await supabase.from('poll_votes').insert({
        user_id: profile.id,
        vote,
        poll_date: pollDate
      })
    }
    setMyVote(vote)
    loadVotes()
  }

  async function postAnnouncement() {
    if (!newAnnouncement.trim() || !profile) return
    await supabase.from('announcements').insert({
      content: newAnnouncement.trim(),
      author_id: profile.id
    })
    setNewAnnouncement('')
    loadAnnouncements()
  }

  async function deleteAnnouncement(id) {
    await supabase.from('announcements').delete().eq('id', id)
    loadAnnouncements()
  }

  async function postMessage() {
    if (!newMessage.trim() || !profile) return
    await supabase.from('messages').insert({
      user_id: profile.id,
      content: newMessage.trim(),
      day_key: getDayKey()
    })
    setNewMessage('')
    loadMessages()
  }

  async function deleteMessage(id) {
    await supabase.from('messages').delete().eq('id', id)
    loadMessages()
  }

  // ========== رندر ==========
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}>در حال بارگذاری...</div>
  }

  if (!session || !profile) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 20 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>301tajrobiroom</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: 30 }}>
          اتاق همکلاسی‌های ۳۰۱ تجربی
        </p>

        <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1, padding: 10, borderRadius: 10, border: 'none',
                background: isLogin ? 'var(--primary)' : 'transparent',
                color: isLogin ? '#fff' : 'var(--text)'
              }}
            >
              ورود
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1, padding: 10, borderRadius: 10, border: 'none',
                background: !isLogin ? 'var(--primary)' : 'transparent',
                color: !isLogin ? '#fff' : 'var(--text)'
              }}
            >
              ثبت‌نام
            </button>
          </div>

          <form onSubmit={handleAuth}>
            <input
              placeholder="اسم"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              type="password"
              placeholder="رمز شخصی"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              type="password"
              placeholder="رمز کلاس"
              value={classCode}
              onChange={e => setClassCode(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit"
              style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600 }}
            >
              {isLogin ? 'ورود' : 'ثبت‌نام'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // صفحه اصلی بعد از لاگین
  const yesVotes = votes.filter(v => v.vote === 'yes')
  const noVotes = votes.filter(v => v.vote === 'no')
  const isAdmin = profile.is_admin || profile.is_owner

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
      {/* هدر */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>301tajrobiroom</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-light)' }}>
            {profile.username} {profile.is_owner ? '🎀' : profile.is_admin ? '🍬' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleTheme} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}>
            {theme === 'hellokitty' ? '🦇 بتمن' : '🎀 هلوکیتی'}
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff' }}>
            خروج
          </button>
        </div>
      </header>

      {/* تخته اطلاعیه */}
      <section style={{ background: 'var(--card)', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>📢 تخته اطلاعیه‌ها</h2>
        
        {isAdmin && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={newAnnouncement}
              onChange={e => setNewAnnouncement(e.target.value)}
              placeholder="اطلاعیه جدید بنویس..."
              rows={2}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
            />
            <button onClick={postAnnouncement} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff' }}>
              ثبت اطلاعیه
            </button>
          </div>
        )}

        {announcements.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>هنوز اطلاعیه‌ای نیست</p>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 4px' }}>{a.content}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-light)' }}>
                <span>{a.profiles?.username} {a.profiles?.is_owner ? '🎀' : a.profiles?.is_admin ? '🍬' : ''}</span>
                {isAdmin && (
                  <button onClick={() => deleteAnnouncement(a.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12 }}>
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* نظرسنجی */}
      <section style={{ background: 'var(--card)', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>📋 نظرسنجی روزانه</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-light)' }}>
          آیا فردا در مدرسه حضور می‌یابید؟
          <br />
          <span style={{ fontSize: 12 }}>تاریخ فردا: {getTomorrowJalali()}</span>
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => submitVote('yes')}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: myVote === 'yes' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: myVote === 'yes' ? 'var(--primary)' : 'var(--bg)', color: myVote === 'yes' ? '#fff' : 'var(--text)'
            }}
          >
            بله ({yesVotes.length})
          </button>
          <button
            onClick={() => submitVote('no')}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: myVote === 'no' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: myVote === 'no' ? 'var(--primary)' : 'var(--bg)', color: myVote === 'no' ? '#fff' : 'var(--text)'
            }}
          >
            خیر ({noVotes.length})
          </button>
        </div>

        <div style={{ fontSize: 13 }}>
          <p style={{ marginBottom: 6 }}><strong>بله:</strong> {yesVotes.map(v => v.profiles?.username).join('، ') || '—'}</p>
          <p><strong>خیر:</strong> {noVotes.map(v => v.profiles?.username).join('، ') || '—'}</p>
        </div>
      </section>

      {/* چت */}
      <section style={{ background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>💬 چت امروز</h2>

        <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>هنوز پیامی نیست</p>
          ) : (
            messages.map(m => (
              <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13 }}>
                    {m.profiles?.username} {m.profiles?.is_owner ? '🎀' : m.profiles?.is_admin ? '🍬' : ''}
                  </strong>
                  {m.user_id === profile.id && (
                    <button onClick={() => deleteMessage(m.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12 }}>
                      حذف
                    </button>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 14 }}>{m.content}</p>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="پیامت رو بنویس..."
            style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            onKeyPress={e => e.key === 'Enter' && postMessage()}
          />
          <button onClick={postMessage} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff' }}>
            بفرست
          </button>
        </div>
      </section>
    </div>
  )
      }
