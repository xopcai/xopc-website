import { ArrowDown, ArrowRight, Check, Clock3, FileText, GitBranch, ListFilter } from "lucide-react";

export function MemoryCover() {
  return <div className="memory-cover" role="img" aria-label="记忆更新示意：旧偏好保留为历史，用户纠正产生新的当前偏好。">
    <div className="memory-cover-label"><GitBranch size={18} aria-hidden /> INSIDE XOPC / 01</div>
    <div className="memory-cover-track">
      <div className="memory-cover-old"><span>过去的偏好</span><strong>回答简短一些</strong><small>保留在历史中</small></div>
      <ArrowRight className="memory-cover-arrow" aria-hidden />
      <div className="memory-cover-new"><span>用户明确纠正</span><strong>以后把推导写清楚</strong><small><Check size={14} aria-hidden /> 当前使用</small></div>
    </div>
    <p>同一个人。同一个问题。答案会变。</p>
  </div>;
}

export function MemoryKinds() {
  const kinds = [
    ["用户偏好", "“我习惯先看结论。”", "描述这个人"],
    ["长期目标", "“我想把产品发布出去。”", "描述想达成的结果"],
    ["阶段优先级", "“本周先处理上线问题。”", "描述此刻的轻重缓急"],
    ["协作规则", "“发给客户前让我确认。”", "约束协作方式"],
    ["工作知识", "“接口方案采用版本 B。”", "保存项目事实与决定"],
  ];
  return <figure className="memory-figure" aria-labelledby="kinds-caption">
    <div className="figure-heading"><FileText size={18} aria-hidden /><span>一句话进入系统之后</span></div>
    <div className="memory-kinds">{kinds.map(([name, example, meaning], i) => <div key={name}><span className="figure-number">0{i + 1}</span><div><strong>{name}</strong><p>{example}</p><small>{meaning}</small></div></div>)}</div>
    <figcaption id="kinds-caption">图 1 · 五类信息分别存储，来源证据单独关联。示例用于说明分类，不代表逐句自动识别的保证。</figcaption>
  </figure>;
}

export function CorrectionTimeline() {
  return <figure className="memory-figure" aria-labelledby="timeline-caption">
    <div className="figure-heading"><Clock3 size={18} aria-hidden /><span>同一个偏好，两段有效时间</span></div>
    <ol className="memory-timeline">
      <li><span>09:00</span><div><strong>“回答尽量简短。”</strong><p>记为用户明确表达的偏好，开始生效。</p></div></li>
      <li><span>次日 10:00</span><div><strong>“以后把推导也写出来，改掉之前那个偏好。”</strong><p>明确指向旧记录的纠正，生成新的当前记录。</p></div></li>
      <li><span>同一事务</span><div><strong>旧记录归档，新记录关联旧记录</strong><p>关闭旧记录的有效期，留下替代关系。</p></div></li>
    </ol>
    <div className="memory-timeline-result"><span>历史：简短回答</span><ArrowRight size={18} aria-hidden /><strong>当前：完整推导</strong></div>
    <figcaption id="timeline-caption">图 2 · 纠正已被识别、且正确关联到原记录后的存储流程。这里的时间和对话为示意。</figcaption>
  </figure>;
}

export function ContextPipeline() {
  const steps = [
    ["范围", "属于当前项目、会话或全局吗？"],
    ["资格", "仍在有效期内？状态和敏感性允许使用吗？"],
    ["排序", "与问题多相关？现在有多重要？"],
    ["预算", "在条数与字符限制内选择内容"],
    ["呈现", "明确表达与暂时推测分开交给模型"],
  ];
  return <figure className="memory-figure" aria-labelledby="pipeline-caption">
    <div className="figure-heading"><ListFilter size={18} aria-hidden /><span>存进记忆 ≠ 每次都交给模型</span></div>
    <div className="memory-pipeline">{steps.map(([title, body], i) => <div key={title}><div className="memory-pipeline-step"><span>{i + 1}</span><strong>{title}</strong><p>{body}</p></div>{i < steps.length - 1 && <ArrowDown size={18} aria-hidden />}</div>)}</div>
    <figcaption id="pipeline-caption">图 3 · 用户信息进入回答上下文前的主要检查。不同信息类别有各自的选择逻辑；这不是全系统的执行流程图。</figcaption>
  </figure>;
}
