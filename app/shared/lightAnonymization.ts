const COMMON_SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁';

/** Replaces obvious personal, contact, and project identifiers in report text. */
export function lightAnonymize(markdown: string): string {
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
    },
  );

  const placeholders = ['[联系方式]', '[项目A]', '[项目B]', '[项目C]', '[项目D]'];
  const tokens = Array.from({ length: 16 }, (_, index) => `\x00\x01${String.fromCharCode(0x40 + index)}`);
  placeholders.forEach((placeholder, index) => {
    result = result.split(placeholder).join(tokens[index]);
  });

  result = result.replace(
    new RegExp(`[${COMMON_SURNAMES}][\\u4e00-\\u9fa5]{1,2}`, 'g'),
    '[人员]',
  );

  placeholders.forEach((placeholder, index) => {
    result = result.split(tokens[index]).join(placeholder);
  });

  return result;
}
