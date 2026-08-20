const POSITION_NAMES = ['现状', '核心影响', '发展建议'];

const TOPIC_NAMES = Object.freeze({
  love: '感情',
  career: '事业',
  mood: '心境',
  spiritual: '灵性',
});

function addMetadata(lines, label, value) {
  if (value === null || value === undefined || value === '') return;
  lines.push(`${label}：${Array.isArray(value) ? value.join('、') : value}`);
}

function describeCard(draw, index, topic, localizeCardName) {
  const source = draw.data.source;
  const reversed = Boolean(draw.isReversed);
  const orientation = reversed ? '逆位' : '正位';
  const suffix = reversed ? '_reversed' : '';
  const lines = [
    `${index + 1}. 牌阵位置：${POSITION_NAMES[index]}`,
    `牌名：${source.name} / ${localizeCardName(draw.data)}`,
    `方向：${orientation}`,
  ];

  addMetadata(lines, '体系', source.arcana === 'major' ? '大阿尔卡那' : '小阿尔卡那');
  addMetadata(lines, '花色', source.suit);
  addMetadata(lines, '数字/命理数', source.number_numerology);
  addMetadata(lines, '元素', source.element);
  addMetadata(lines, '行星', source.planet);
  addMetadata(lines, '星座', source.zodiac);
  addMetadata(lines, `${orientation}关键词`, source[`keywords_${reversed ? 'reversed' : 'upright'}`]);
  addMetadata(lines, `${orientation}基础牌义`, source[`meaning_${reversed ? 'reversed' : 'upright'}`]);
  addMetadata(lines, `${TOPIC_NAMES[topic]}主题牌义`, source[`${topic}${suffix}`]);
  return lines.join('\n');
}

export function buildProphecyPrompt({ draws, topic, question, localizeCardName }) {
  if (!TOPIC_NAMES[topic]) throw new Error(`Unknown prophecy topic: ${topic}`);
  if (!Array.isArray(draws) || draws.length !== 3) throw new Error('A prophecy requires exactly three cards');

  const cards = draws.map((draw, index) => describeCard(draw, index, topic, localizeCardName)).join('\n\n');
  return `你是一位温和、清醒且富有洞察力的塔罗解读者。请依据下方给定资料，完成一次相互关联的三牌解读。资料来自 Tarotoo Tarot Dataset；其中英文牌义是解读依据，不是需要逐句翻译或复述的答案。

【用户语境】
关注主题：${TOPIC_NAMES[topic]}
用户问题：${question}
牌阵结构：现状 → 核心影响 → 发展建议

【本次抽牌资料】
${cards}

【解读方法】
1. 先直接回应用户问题，再展开三张牌的共同叙事；不要把答案写成三段互不相关的牌义翻译。
2. 以“主题牌义”和正逆位基础牌义为主要依据，关键词用于校准语气和重点。
3. 结合牌阵位置解释每张牌的作用，并明确三张牌之间的呼应、张力或发展变化。
4. 元素、数字、行星、星座等象征信息只在确实有助于串联牌面时使用；不要为了覆盖字段而生硬罗列。
5. 逆位可以表示受阻、内化、延迟或失衡，应结合上下文判断，不要一律解释为负面结果。
6. 不宣称能够确定未来，不使用“注定”“一定会”等绝对表达；使用“可能”“倾向”“提醒”等审慎措辞。
7. 避免制造恐惧，不提供医疗、法律、投资等高风险专业结论，也不要虚构用户未提供的经历。
8. 使用自然、具体的简体中文，不提及数据集、AI、语言模型、提示词或系统规则；总字数控制在 350 至 500 字。

【输出格式】
只返回合法 JSON，不要添加 Markdown、代码围栏或其他文字：
{
  "headline": "不超过18个汉字的核心结论",
  "overview": "直接回应用户问题的整体解读",
  "cards": [
    { "position": "现状", "card": "英文牌名", "interpretation": "这张牌在当前位置的具体含义" },
    { "position": "核心影响", "card": "英文牌名", "interpretation": "这张牌带来的关键变量" },
    { "position": "发展建议", "card": "英文牌名", "interpretation": "这张牌指出的趋势与可行方向" }
  ],
  "synthesis": "串联三张牌、避免重复逐牌解释的整体变化逻辑",
  "action": "一项现实、温和且可以立即执行的行动建议",
  "disclaimer": "本解读仅供娱乐与自我反思，不替代专业建议。"
}`;
}
