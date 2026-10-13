const { GoogleGenerativeAI } = require('@google/generative-ai');

// Smart institutional knowledge fallback
const getSmartFallback = (query) => {
  const p = (query || '').toLowerCase();
  if (p.includes('attendance') || p.includes('75') || p.includes('criteria') || p.includes('shortage')) {
    return 'CampusOne strictly enforces a **75% minimum attendance requirement** for all registered undergraduate and postgraduate courses. If your attendance drops below 75%, an automated red warning alert is triggered on your portal. You risk examination debarment unless valid medical leaves are approved by the Dean Academics.';
  }
  if (p.includes('grievance') || p.includes('complaint') || p.includes('hostel') || p.includes('mess')) {
    return 'Campus grievances can be filed under the **Grievances** tab. Categories include **Hostel, Mess, Academic, and Maintenance**. Once filed, you can track real-time resolution stages: *Pending* ➔ *In Progress* ➔ *Resolved*. Administrative staff will add resolution notes upon inspection.';
  }
  if (p.includes('assignment') || p.includes('submission') || p.includes('deadline')) {
    return 'Course assignments are listed under the **Assignments** module. Students can submit repository links or written text before the deadline. Faculty can review submissions, assign letter grades, and give feedback.';
  }
  if (p.includes('event') || p.includes('club') || p.includes('fest') || p.includes('hackathon')) {
    return 'Upcoming fests, technical hackathons, and cultural evenings are cataloged in the **Campus Events** feed. Click the RSVP button on any event card to reserve your pass with dynamic counter tracking.';
  }
  if (p.includes('room') || p.includes('booking') || p.includes('hall') || p.includes('lab')) {
    return 'Seminar halls, conference spaces, and computer labs can be reserved through the **Room Booking** section. Submit your date, time slot, and purpose. Reservations are reviewed and approved by campus administration.';
  }
  if (p.includes('lost') || p.includes('found')) {
    return 'Misplaced or retrieved belongings can be posted on the **Lost & Found** board. Include item descriptions, location found/lost, and contact information for immediate retrieval.';
  }
  return 'Hello! I am CampusBot, your official 24/7 AI student assistant for the CampusOne platform. I can assist you with attendance rules (remember 75% is mandatory!), assignment submissions, club event RSVPs, room bookings, and campus grievance procedures. How can I help you today?';
};

exports.chatWithCampusBot = async (req, res) => {
  try {
    const userPrompt = req.body.message || req.body.prompt;
    const historyList = req.body.history || req.body.chatHistory || [];

    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message string is required in request body',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
      const fallbackReply = getSmartFallback(userPrompt);
      return res.status(200).json({
        success: true,
        reply: fallbackReply,
        source: 'smart-fallback',
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction:
          'You are CampusBot, the official 24/7 AI student assistant for CampusOne platform. Answer academic questions, attendance rules (mandatory 75% minimum), grievance procedures, club events, and room bookings politely, accurately, and concisely. Use clean markdown formatting with lists and bold headers where appropriate.',
      });

      const formattedHistory = [];
      if (Array.isArray(historyList)) {
        historyList.slice(-8).forEach((item) => {
          if (item.role && (item.content || item.text)) {
            formattedHistory.push({
              role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.content || item.text }],
            });
          }
        });
      }

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(userPrompt);
      const reply = result.response.text();

      return res.status(200).json({
        success: true,
        reply,
        source: 'gemini-1.5-flash',
      });
    } catch (geminiError) {
      console.warn('[CampusBot Fallback activated]:', geminiError.message);
      const fallbackReply = getSmartFallback(userPrompt);
      return res.status(200).json({
        success: true,
        reply: fallbackReply,
        source: 'smart-fallback',
      });
    }
  } catch (error) {
    console.error('Error in chatWithCampusBot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error communicating with AI assistant',
    });
  }
};
