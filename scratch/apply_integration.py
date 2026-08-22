import os

with open('scratch/aiclassroom_commit.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace End Lesson button
old_end = '<button type="button" className="end-lesson" onClick={onEnd}>'
new_end = '''<button type="button" className="end-lesson" onClick={async () => {
          if (sessionId) {
            try { await api(`/tutor/sessions/${sessionId}/complete`, { method: "PATCH" }); } catch (e) {}
          }
          onEnd();
        }}>'''
if old_end in code:
    code = code.replace(old_end, new_end)
    print("Replaced end-lesson!")

# Replace teacher message
old_teacher_msg = '''<article className="teacher-message">
            {lessonTitle ? `Today we are learning: ${lessonTitle}.` : "Welcome to your AI lesson!"}
          </article>'''
new_teacher_msg = '''<article className="teacher-message">
            {loadingAI && chatMessages.length === 0 ? (
              "TutorFlow AI is preparing your personalized lesson..."
            ) : chatMessages.filter(m => m.sender === "ai").length > 0 ? (
              chatMessages.filter(m => m.sender === "ai").slice(-1)[0].text
            ) : (
              lessonTitle ? `Today we are learning: ${lessonTitle}.` : "Welcome to your AI lesson!"
            )}
          </article>'''
if old_teacher_msg in code:
    code = code.replace(old_teacher_msg, new_teacher_msg)
    print("Replaced teacher-message!")

# Replace ContentListView call
old_clv = '<ContentListView type={activeRailTab} />'
new_clv = '<ContentListView type={activeRailTab} topic={lessonTitle} />'
if old_clv in code:
    code = code.replace(old_clv, new_clv)
    print("Replaced ContentListView call!")

# Replace ContentListView definition
old_clv_def = '''const ContentListView = ({ type }) => {
  const [activeTab, setActiveTab] = useState("All");

  const mockData = {'''

new_clv_def = '''const ContentListView = ({ type, topic = "Algebra" }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api(`/tutor/materials?category=${encodeURIComponent(type)}&topic=${encodeURIComponent(topic)}`)
      .then((data) => {
        if (isMounted) {
          setMaterials(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMaterials([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [type, topic]);

  const mockData = {'''

if old_clv_def in code:
    code = code.replace(old_clv_def, new_clv_def)
    print("Replaced ContentListView definition!")

# Replace quick replies
old_qr = '''<div className="quick-replies">
              <button type="button" onClick={() => setChatInput("Explain again")}>Explain again</button>
              <button type="button" onClick={() => setChatInput("More examples")}>More examples</button>
              <button type="button" onClick={() => setChatInput("I don't understand")}>I don't understand</button>
            </div>'''
new_qr = '''<div className="quick-replies">
              <button type="button" onClick={() => handleSendMessage("Explain again")}>Explain again</button>
              <button type="button" onClick={() => handleSendMessage("More examples")}>More examples</button>
              <button type="button" onClick={() => handleSendMessage("I don't understand")}>I don't understand</button>
            </div>'''
if old_qr in code:
    code = code.replace(old_qr, new_qr)
    print("Replaced quick-replies!")

# Replace chat input wrap
old_input = '''          <div className="chat-input-wrap">
            <input
              className="chat-input"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput.trim()) {
                  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  setChatMessages(prev => [...prev, { sender: "student", text: chatInput.trim(), time: now }]);
                  setChatInput("");
                }
              }}
            />
            <div className="chat-input-actions">
              <Mic size={18} />
              <Send size={18} />
            </div>
          </div>'''

new_input = '''          <div className="chat-input-wrap">
            <input
              className="chat-input"
              placeholder={loadingAI ? "AI Teacher is responding..." : "Type a message..."}
              value={chatInput}
              disabled={loadingAI}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <div className="chat-input-actions">
              <Mic size={18} />
              <Send
                size={18}
                style={{ cursor: chatInput.trim() && !loadingAI ? "pointer" : "default" }}
                onClick={() => handleSendMessage()}
              />
            </div>
          </div>'''

if old_input in code:
    code = code.replace(old_input, new_input)
    print("Replaced chat input wrap!")

with open('frontend/src/pages/AIClassroom.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Finished writing frontend/src/pages/AIClassroom.jsx!")
