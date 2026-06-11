// app/shared/templateBlockDefaults.ts
//
// 轻量脱敏:替换明显敏感词。供对外报告生成完毕后调用。
//
// 不做语义级脱敏 — 只做明显敏感词替换:
//  - 2-3 字中文姓名(常见姓氏后跟 1-2 字)→ [人员]
//  - 11 位手机号(1[3-9]xxxxxxxxx)          → [联系方式]
//  - 邮箱                                    → [联系方式]
//  - 项目代号(项目N / 客户X / Apollo-X 等)   → [项目A] [项目B] ...
//
// 实现注意:为保证幂等性,phone/email/project 替换产生的占位符在姓氏替换前
// 用 ASCII 标记临时占位(避免占位符里的汉字被姓氏 regex 误匹配)。

const COMMON_SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁';

export function lightAnonymize(markdown: string): string {
  // 1. 先做 phone / email / project 替换,产生占位符
  let result = markdown;
  result = result.replace(/\b1[3-9]\d{9}\b/g, '[联系方式]');
  result = result.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[联系方式]');
  const projectMap = new Map<string, string>();
  let projectCounter = 0;
  result = result.replace(
    /(项目\s*\d+|客户\s*[一-龥A-Za-z]{1,8}|Project[\s_-]*[A-Za-z0-9]{1,8}|[A-Z][a-zA-Z]+-[A-Z0-9]{1,5})/g,
    (match) => {
      if (projectMap.has(match)) return projectMap.get(match)!;
      projectCounter += 1;
      const tag = projectCounter <= 4
        ? `[项目${'ABCD'[projectCounter - 1]}]`
        : `[项目${projectCounter}]`;
      projectMap.set(match, tag);
      return tag;
    }
  );

  // 2. 把刚生成的占位符用 ASCII 标记临时替换(避免姓氏 regex 匹配占位符里的汉字)
  const placeholders = ['[联系方式]', '[项目A]', '[项目B]', '[项目C]', '[项目D]'];
  const tokens: string[] = []; // index i = token used for placeholders[i]
  for (let i = 0; i < 16; i++) {
    tokens.push(`\x00\x01${String.fromCharCode(0x40 + i)}`); // 16 unique ASCII tokens
  }
  placeholders.forEach((ph, i) => {
    if (i < tokens.length) {
      result = result.split(ph).join(tokens[i]);
    }
  });

  // 3. 现在可以安全做姓氏匹配了
  result = result.replace(
    new RegExp(`[${COMMON_SURNAMES}][\\u4e00-\\u9fa5]{1,2}`, 'g'),
    '[人员]'
  );

  // 4. 把 ASCII token 还原为占位符
  placeholders.forEach((ph, i) => {
    if (i < tokens.length) {
      result = result.split(tokens[i]).join(ph);
    }
  });

  return result;
}