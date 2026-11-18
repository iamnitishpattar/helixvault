with open(r'e:\new_project_main\frontend\src\components\DecoderView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                <input 
                  aria-label="Verify Integrity"
                  type="file" 
                  className="input-glass" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const originalHash = await calculateSHA256(e.target.files[0]);
                      if (decodedHash === validationHash) {
                        toast.success('Integrity Verified', '✅ INTEGRITY VERIFIED 100%! The decoded file is a perfect pixel-by-pixel match with your original file.');
                      } else {
                        toast.error('Integrity Check Failed', '❌ INTEGRITY FAILED! The decoded file does not match the original file.');
                      }
                    }
                  }}
                />"""

replacement = """                <input 
                  aria-label="Verify Integrity"
                  type="file" 
                  className="input-glass" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleVerifyIntegrity(e.target.files[0]);
                    } else {
                      setIntegrityResult(null);
                    }
                  }}
                />

                {integrityResult && integrityResult.checking && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                    <RefreshCw className="animate-spin" size={16} /> Computing SHA-256 checksum of original file...
                  </div>
                )}

                {integrityResult && !integrityResult.checking && integrityResult.matched && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid #10b981',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <CheckCircle2 color="#10b981" size={20} />
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                        100% BIT-PERFECT INTEGRITY MATCH
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>
                      The decoded biological output exactly matches your uploaded original file with zero corruption.
                    </p>
                    <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                      <div style={{ color: '#94a3b8' }}>Original File SHA-256 ({integrityResult.fileName}):</div>
                      <div style={{ fontFamily: 'monospace', color: '#10b981', wordBreak: 'break-all', marginBottom: '4px' }}>
                        {integrityResult.originalHash}
                      </div>
                      <div style={{ color: '#94a3b8' }}>Recovered File SHA-256:</div>
                      <div style={{ fontFamily: 'monospace', color: '#10b981', wordBreak: 'break-all' }}>
                        {decodedHash}
                      </div>
                    </div>
                  </div>
                )}

                {integrityResult && !integrityResult.checking && integrityResult.matched === false && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <XCircle color="#ef4444" size={20} />
                      <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>
                        INTEGRITY CHECK FAILED: CHECKSUM MISMATCH
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>
                      The uploaded original file does not match the decoded output.
                    </p>
                    <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                      <div style={{ color: '#94a3b8' }}>Original File SHA-256 ({integrityResult.fileName}):</div>
                      <div style={{ fontFamily: 'monospace', color: '#ef4444', wordBreak: 'break-all', marginBottom: '4px' }}>
                        {integrityResult.originalHash}
                      </div>
                      <div style={{ color: '#94a3b8' }}>Recovered File SHA-256:</div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                        {decodedHash}
                      </div>
                    </div>
                  </div>
                )}"""

# Normalize newlines
target_norm = target.replace('\r\n', '\n')
content_norm = content.replace('\r\n', '\n')

if target_norm in content_norm:
    new_content = content_norm.replace(target_norm, replacement.replace('\r\n', '\n'))
    with open(r'e:\new_project_main\frontend\src\components\DecoderView.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated DecoderView.jsx!")
else:
    print("Could not find target in content_norm!")

