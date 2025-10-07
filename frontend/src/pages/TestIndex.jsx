import React from 'react';

const TestIndex = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          BlockLearn: Your Path to Skill Mastery
        </h1>

        <p style={{
          fontSize: '1.2rem',
          textAlign: 'center',
          marginBottom: '3rem',
          color: 'rgba(255,255,255,0.9)',
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          The revolutionary platform where students exchange knowledge. Learn what you need, teach what you know.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '4rem'
        }}>
          <button style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}>
            Get Started Free
          </button>

          <button style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            See How It Works
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {[
            { title: 'Web Development', desc: 'Master modern web technologies' },
            { title: 'Graphic Design', desc: 'Learn creative design principles' },
            { title: 'Language Learning', desc: 'Practice languages with native speakers' },
            { title: 'Business Skills', desc: 'Develop entrepreneurial mindset' }
          ].map((skill, index) => (
            <div key={index} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '1rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>
                {skill.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                {skill.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <p>© 2025 BlockLearn. Empowering students worldwide.</p>
        </div>
      </div>
    </div>
  );
};

export default TestIndex;
