import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let knowledgeBase = null;
let groqClient = null;

// Khởi tạo Groq client
function initGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    try {
      groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("✅ Groq AI enabled");
    } catch (error) {
      console.error("❌ Groq initialization failed:", error.message);
    }
  }
  return groqClient;
}

async function loadKnowledgeBase() {
  if (!knowledgeBase) {
    try {
      const data = await fs.readFile(
        path.join(__dirname, "../data/hearing-loss-knowledge.json"),
        "utf-8"
      );
      knowledgeBase = JSON.parse(data);
      console.log("✅ Knowledge base loaded");
    } catch (error) {
      console.error("❌ Error loading knowledge base:", error);
      knowledgeBase = {
        metadata: {},
        age_groups: [],
        hearing_loss_types: [],
        early_signs_by_age: [],
        severity_levels: [],
        diagnostic_tests: [],
        treatment_options: [],
      };
    }
  }
  return knowledgeBase;
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  words2.forEach(w2 => {
    if (words1.some(w1 => w1.includes(w2) || w2.includes(w1))) {
      matches++;
    }
  });
  
  return matches > 0 ? matches / Math.max(words1.length, words2.length) : 0;
}

function searchInKnowledge(query, kb) {
  const results = [];

  kb.age_groups?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.ageRange) {
      score += calculateSimilarity(query, item.ageRange) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.keyDevelopments) {
      item.keyDevelopments.forEach(dev => {
        score += calculateSimilarity(query, dev);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "age_group",
        data: item,
        relevance: Math.min(1, score / 6),
        score: score
      });
    }
  });

  kb.early_signs_by_age?.forEach((item) => {
    let score = 0;
    
    if (item.ageGroup) {
      score += calculateSimilarity(query, item.ageGroup) * 3;
    }
    
    if (item.normalBehavior) {
      item.normalBehavior.forEach(behavior => {
        score += calculateSimilarity(query, behavior) * 2;
      });
    }
    
    if (item.warningSignsHearingLoss) {
      item.warningSignsHearingLoss.forEach(warning => {
        score += calculateSimilarity(query, warning) * 2;
      });
    }
    
    if (item.parentActions) {
      item.parentActions.forEach(action => {
        score += calculateSimilarity(query, action);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "early_signs",
        data: item,
        relevance: Math.min(1, score / 6),
        score: score
      });
    }
  });

  kb.hearing_loss_types?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.detailedCauses) {
      item.detailedCauses.forEach(cause => {
        score += calculateSimilarity(query, cause);
      });
    }
    
    if (item.symptoms) {
      item.symptoms.forEach(symptom => {
        score += calculateSimilarity(query, symptom);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "hearing_loss_type",
        data: item,
        relevance: Math.min(1, score / 5),
        score: score
      });
    }
  });

  kb.severity_levels?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.decibel) {
      score += calculateSimilarity(query, item.decibel) * 2;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.impacts) {
      item.impacts.forEach(impact => {
        score += calculateSimilarity(query, impact);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "severity",
        data: item,
        relevance: Math.min(1, score / 5),
        score: score
      });
    }
  });

  kb.diagnostic_tests?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.ageRange) {
      score += calculateSimilarity(query, item.ageRange) * 2;
    }
    
    if (item.methods) {
      item.methods?.forEach(method => {
        if (method.name) score += calculateSimilarity(query, method.name);
        if (method.description) score += calculateSimilarity(query, method.description);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "diagnostic_test",
        data: item,
        relevance: Math.min(1, score / 6),
        score: score
      });
    }
  });

  kb.treatment_options?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.indication) {
      score += calculateSimilarity(query, item.indication) * 2;
    }
    
    if (score > 0) {
      results.push({
        type: "treatment",
        data: item,
        relevance: Math.min(1, score / 5),
        score: score
      });
    }
  });

  kb.health_considerations?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (item.symptoms) {
      item.symptoms.forEach(symptom => {
        score += calculateSimilarity(query, symptom);
      });
    }
    
    if (score > 0) {
      results.push({
        type: "health",
        data: item,
        relevance: Math.min(1, score / 4),
        score: score
      });
    }
  });

  kb.family_support?.forEach((item) => {
    let score = 0;
    
    if (item.name) {
      score += calculateSimilarity(query, item.name) * 3;
    }
    
    if (item.description) {
      score += calculateSimilarity(query, item.description) * 2;
    }
    
    if (score > 0) {
      results.push({
        type: "family_support",
        data: item,
        relevance: Math.min(1, score / 4),
        score: score
      });
    }
  });

  kb.frequently_asked_questions?.forEach((item) => {
    let score = 0;
    
    if (item.question) {
      score += calculateSimilarity(query, item.question) * 2;
    }
    
    if (item.answer) {
      score += calculateSimilarity(query, item.answer);
    }
    
    if (score > 0) {
      results.push({
        type: "faq",
        data: item,
        relevance: Math.min(1, score / 3),
        score: score
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

function buildContextForAI(searchResults) {
  let context = "";

  if (searchResults.length === 0) {
    context = `Không tìm thấy thông tin cụ thể trong cơ sở dữ liệu. 
Vui lòng sử dụng kiến thức chuyên môn của bạn về khiếm thính ở trẻ em để trả lời câu hỏi này một cách hữu ích và chính xác.
Hãy cung cấp thông tin hữu ích, dễ hiểu cho cha mẹ/người chăm sóc.`;
    return context;
  }

  context = "Thông tin liên quan từ cơ sở dữ liệu:\n\n";
  const topResults = searchResults.slice(0, 3);

  topResults.forEach((result, index) => {
    context += `[${index + 1}] `;
    
    if (result.type === "age_group") {
      const data = result.data;
      context += `Nhóm tuổi: ${data.name} (${data.ageRange}):\n`;
      context += `- Mô tả: ${data.description}\n`;
      context += `- Phát triển chính: ${data.keyDevelopments?.slice(0, 2).join("; ")}\n`;
      context += `- Hướng dẫn cha mẹ: ${data.parentGuidance}\n\n`;
    } else if (result.type === "early_signs") {
      const data = result.data;
      context += `Dấu hiệu ở ${data.ageGroup}:\n`;
      context += `- Hành vi bình thường: ${data.normalBehavior?.slice(0, 2).join("; ")}\n`;
      context += `- Cảnh báo khiếm thính: ${data.warningSignsHearingLoss?.slice(0, 2).join("; ")}\n`;
      context += `- Khuyến cáo: ${data.recommendations?.slice(0, 2).join("; ")}\n`;
      context += `- Hành động cha mẹ: ${data.parentActions?.slice(0, 2).join("; ")}\n\n`;
    } else if (result.type === "hearing_loss_type") {
      const data = result.data;
      context += `${data.name}:\n`;
      context += `- Mô tả: ${data.description}\n`;
      context += `- Nguyên nhân: ${data.detailedCauses?.slice(0, 2).join(", ")}\n`;
      context += `- Mức độ: ${data.severity}\n`;
      context += `- Tiên lượng: ${data.prognosis}\n`;
      context += `- Điều trị: ${data.treatment}\n\n`;
    } else if (result.type === "severity") {
      const data = result.data;
      context += `${data.name} (${data.decibel}):\n`;
      context += `- Mô tả: ${data.description}\n`;
      context += `- So sánh thực tế: ${data.realLifeComparison}\n`;
      if (data.impacts) context += `- Tác động: ${data.impacts.slice(0, 2).join("; ")}\n`;
      if (data.intervention) context += `- Can thiệp: ${data.intervention}\n`;
      if (data.educationImpact) context += `- Ảnh hưởng học tập: ${data.educationImpact}\n`;
      context += "\n";
    } else if (result.type === "diagnostic_test") {
      const data = result.data;
      context += `${data.name}:\n`;
      context += `- Mô tả: ${data.description}\n`;
      context += `- Tuổi: ${data.ageRange}\n`;
      if (data.methods && data.methods[0]) {
        context += `- Phương pháp: ${data.methods.map(m => m.name).join(", ")}\n`;
      }
      if (data.importance) context += `- Tầm quan trọng: ${data.importance}\n`;
      context += "\n";
    } else if (result.type === "treatment") {
      const data = result.data;
      context += `${data.name}:\n`;
      context += `- Mô tả: ${data.description}\n`;
      context += `- Chỉ định: ${data.indication}\n`;
      if (data.types) context += `- Loại: ${Array.isArray(data.types) ? data.types.join(", ") : data.types}\n`;
      context += "\n";
    } else if (result.type === "health") {
      const data = result.data;
      context += `${data.name}:\n`;
      context += `- Mô tả: ${data.description}\n`;
      if (data.symptoms) context += `- Triệu chứng: ${data.symptoms.join(", ")}\n`;
      if (data.prevention) context += `- Phòng ngừa: ${data.prevention.join(", ")}\n`;
      context += "\n";
    } else if (result.type === "family_support") {
      const data = result.data;
      context += `${data.name}:\n`;
      context += `- Mô tả: ${data.description}\n`;
      if (data.resources) context += `- Nguồn hỗ trợ: ${data.resources.join(", ")}\n`;
      context += "\n";
    } else if (result.type === "faq") {
      const data = result.data;
      context += `FAQ:\nQ: ${data.question}\nA: ${data.answer}\n\n`;
    }
  });

  return context;
}

async function generateAIAnswer(query, context, searchResults) {
  const client = initGroq();
  
  if (!client) {
    console.log("⚠️ Groq API not configured, using fallback with AI-like response");
    return buildSmartFallbackAnswer(query, searchResults);
  }

  try {
    const systemPrompt = `Bạn là trợ lý AI chuyên về khiếm thính ở trẻ em. 
Nhiệm vụ của bạn là trả lời các câu hỏi của phụ huynh và người chăm sóc về:
- Dấu hiệu nhận biết khiếm thính theo độ tuổi
- Phương pháp điều trị và can thiệp
- Thiết bị trợ thính và cấy ốc tai
- Theo dõi sức khỏe thính giác
- Hỗ trợ gia đình
- Chẩn đoán và thử nghiệm

Hãy trả lời:
- Dễ hiểu, thân thiện với phụ huynh
- Chính xác và hữu ích
- Có cấu trúc rõ ràng với emoji phù hợp
- Ngắn gọn nhưng đầy đủ (200-400 từ)
- Luôn cung cấp thông tin hữu ích ngay cả khi không có dữ liệu cụ thể
- Nếu thông tin trong database không đủ, hãy sử dụng kiến thức chuyên môn để bổ sung
- Gợi ý phụ huynh tham khảo bác sĩ chuyên khoa nếu cần thiết

QUAN TRỌNG: 
- Không từ chối trả lời
- Không nói "tôi không tìm thấy" một cách cực đoan
- Luôn cố gắng cung cấp thông tin hữu ích cho cha mẹ/người chăm sóc`;

    const userPrompt = `Câu hỏi: ${query}

${context}

Hãy trả lời câu hỏi trên. Nếu có dữ liệu, hãy sử dụng nó; nếu không, hãy sử dụng kiến thức chuyên môn của bạn để cung cấp câu trả lời hữu ích.`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || buildSmartFallbackAnswer(query, searchResults);
  } catch (error) {
    console.error("❌ Groq API error:", error.message);
    return buildSmartFallbackAnswer(query, searchResults);
  }
}

function buildSmartFallbackAnswer(query, searchResults) {
  let answer = "";

  if (searchResults.length > 0) {
    const topResults = searchResults.slice(0, 2);

    topResults.forEach((result) => {
      if (result.type === "age_group") {
        const data = result.data;
        answer += `\n👶 **${data.name} (${data.ageRange})**\n\n`;
        answer += `${data.description}\n\n`;
        answer += `📌 Phát triển chính:\n`;
        data.keyDevelopments?.slice(0, 3).forEach((dev) => {
          answer += `  • ${dev}\n`;
        });
      } else if (result.type === "early_signs") {
        const data = result.data;
        answer += `\n📋 **Dấu hiệu ở ${data.ageGroup}:**\n\n✅ Hành vi bình thường:\n`;
        data.normalBehavior?.slice(0, 2).forEach((b) => {
          answer += `  • ${b}\n`;
        });
        answer += `\n⚠️ Cảnh báo khiếm thính:\n`;
        data.warningSignsHearingLoss?.slice(0, 2).forEach((w) => {
          answer += `  • ${w}\n`;
        });
        answer += `\n💡 Hành động cha mẹ:\n`;
        data.parentActions?.slice(0, 2).forEach((a) => {
          answer += `  • ${a}\n`;
        });
      } else if (result.type === "hearing_loss_type") {
        const data = result.data;
        answer += `\n🔊 **${data.name}**\n`;
        answer += `• Mô tả: ${data.description}\n`;
        answer += `• Nguyên nhân: ${data.detailedCauses?.[0] || "Không rõ"}\n`;
        answer += `• Mức độ: ${data.severity}\n`;
        answer += `• Tiên lượng: ${data.prognosis}\n`;
        answer += `• Điều trị: ${data.treatment}\n`;
      } else if (result.type === "severity") {
        const data = result.data;
        answer += `\n📊 **${data.name} (${data.decibel})**\n`;
        answer += `• Mô tả: ${data.description}\n`;
        answer += `• So sánh: ${data.realLifeComparison}\n`;
        if (data.impacts && data.impacts.length > 0) {
          answer += `• Tác động: ${data.impacts[0]}\n`;
        }
        if (data.intervention) answer += `• Can thiệp: ${data.intervention}\n`;
      } else if (result.type === "diagnostic_test") {
        const data = result.data;
        answer += `\n🔍 **${data.name}**\n`;
        answer += `• Tuổi: ${data.ageRange}\n`;
        answer += `• Mô tả: ${data.description}\n`;
        if (data.methods && data.methods.length > 0) {
          answer += `• Phương pháp: ${data.methods.map(m => m.name).join(", ")}\n`;
        }
        if (data.importance) answer += `• Tầm quan trọng: ${data.importance}\n`;
      } else if (result.type === "treatment") {
        const data = result.data;
        answer += `\n💊 **${data.name}**\n`;
        answer += `• Chỉ định: ${data.indication}\n`;
        answer += `• Mô tả: ${data.description}\n`;
      } else if (result.type === "faq") {
        const data = result.data;
        answer += `\n❓ **${data.question}**\n\n${data.answer}\n`;
      }
    });

    return answer;
  }

  answer = `Dựa trên kiến thức về khiếm thính ở trẻ em, tôi có thể chia sẻ thông tin sau:\n\n`;

  answer += `📌 **Thông tin hữu ích:**\n`;
  answer += `• Khiếm thính ở trẻ em là tình trạng phổ biến nhất có thể được phát hiện sớm\n`;
  answer += `• Sàng lọc sớm và can thiệp kịp thời là rất quan trọng\n`;
  answer += `• Có nhiều phương pháp điều trị và hỗ trợ hiện đại\n\n`;
  
  answer += `🔍 **Bạn có thể tìm hiểu thêm về:**\n`;
  answer += `• 👶 Dấu hiệu khiếm thính theo từng độ tuổi\n`;
  answer += `• 💊 Phương pháp điều trị và thiết bị trợ thính\n`;
  answer += `• 🦻 Các loại khiếm thính và mức độ nặng nhẹ\n`;
  answer += `• 🔍 Các phương pháp chẩn đoán và thử nghiệm\n`;
  answer += `• 📋 Dấu hiệu cảnh báo cần chú ý\n`;
  answer += `• 👨‍👩‍👧 Hỗ trợ cho gia đình và con em\n\n`;
  
  answer += `💡 **Lời khuyên:** Nếu bạn có lo lắng về thính giác của con, hãy tham khảo bác sĩ chuyên khoa tai mũi họng hoặc bác sĩ nhi khoa để được tư vấn chuyên môn.`;

  return answer;
}

export const chatbotController = {
  askQuestion: async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`💬 Question: ${message}`);

      const kb = await loadKnowledgeBase();
      const searchResults = searchInKnowledge(message, kb);

      console.log(`🔍 Found ${searchResults.length} results`);

      const context = buildContextForAI(searchResults);
      const answer = await generateAIAnswer(message, context, searchResults);

      res.json({
        success: true,
        question: message,
        answer: answer,
        sources_found: searchResults.length,
        ai_powered: !!groqClient,
      });
    } catch (error) {
      console.error("❌ Chatbot error:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  },

  getKnowledge: async (req, res) => {
    try {
      const kb = await loadKnowledgeBase();

      const summary = {
        age_groups: kb.age_groups?.length || 0,
        hearing_loss_types: kb.hearing_loss_types?.length || 0,
        early_signs_by_age: kb.early_signs_by_age?.length || 0,
        severity_levels: kb.severity_levels?.length || 0,
        diagnostic_tests: kb.diagnostic_tests?.length || 0,
        treatment_options: kb.treatment_options?.length || 0,
        health_topics: kb.health_considerations?.length || 0,
        family_support: kb.family_support?.length || 0,
        faq_count: kb.frequently_asked_questions?.length || 0,
      };

      res.json({
        success: true,
        summary,
        ai_enabled: !!groqClient,
        categories: [
          "👶 Nhóm tuổi",
          "📋 Dấu hiệu sớm",
          "🔊 Loại khiếm thính",
          "📊 Mức độ nặng nhẹ",
          "🔍 Chẩn đoán & thử nghiệm",
          "💊 Phương pháp điều trị",
          "🏥 Vấn đề sức khỏe",
          "👨‍👩‍👧 Hỗ trợ gia đình",
        ],
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  searchKnowledge: async (req, res) => {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const kb = await loadKnowledgeBase();
      const results = searchInKnowledge(query, kb);

      res.json({
        success: true,
        query,
        results_count: results.length,
        results: results.slice(0, 5).map((r) => ({
          type: r.type,
          title: r.data.name || r.data.question || r.data.ageGroup || r.data.englishName,
          relevance: (r.relevance * 100).toFixed(0) + "%",
        })),
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};