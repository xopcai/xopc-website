import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { TaskCard } from "@/components/task-card"
import { TaskColumn } from "@/components/task-column"

export default function Home() {
  const tasks = [
    { id: 'PRD-001', title: '设计用户反馈系统原型', tag: '产品', tagColor: '#a855f7', status: 'todo' as const },
    { id: 'DES-002', title: '设计登录页面 UI 组件', tag: '设计', tagColor: '#ec4899', status: 'todo' as const },
    { id: 'DEV-003', title: '实现用户认证 API', tag: '开发', tagColor: '#3b82f6', status: 'todo' as const },
    { id: 'PRD-002', title: '确认支付流程方案', tag: '产品', tagColor: '#a855f7', status: 'plan' as const },
    { id: 'DEV-001', title: '生成 API 文档', tag: '开发', tagColor: '#3b82f6', status: 'doing' as const, progress: 65 },
    { id: 'DES-001', title: '设计 Logo 草图', tag: '设计', tagColor: '#ec4899', status: 'done' as const },
  ]

  const [taskList, setTaskList] = useState(tasks)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: 'todo' | 'plan' | 'doing' | 'done') => {
    e.preventDefault()
    if (draggedTask) {
      setTaskList(prev =>
        prev.map(task =>
          task.id === draggedTask ? { ...task, status: newStatus } : task
        )
      )
      setDraggedTask(null)
    }
  }

  const todoTasks = taskList.filter(t => t.status === 'todo')
  const planTasks = taskList.filter(t => t.status === 'plan')
  const doingTasks = taskList.filter(t => t.status === 'doing')
  const doneTasks = taskList.filter(t => t.status === 'done')

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">XOPC</span>
            <span className="text-xs text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded bg-sky-500/10">
              ALPHA
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#vision" className="text-sm text-slate-400 hover:text-white transition-colors">
              Vision
            </a>
            <a href="#demo" className="text-sm text-slate-400 hover:text-white transition-colors">
              Demo
            </a>
            <a href="#join" className="text-sm text-slate-400 hover:text-white transition-colors">
              Join
            </a>
          </nav>
          <Button size="sm">Join Waitlist</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Super Personal</span>
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Creation Formula
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            XOPC = x • One • Person • Company
            <br />
            <span className="text-sky-400 font-medium">一个人 + AI = 一家公司</span>
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
            <Card className="p-6 bg-slate-800/30 border-slate-800">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-white mb-1">AI Task Engine</h3>
              <p className="text-sm text-slate-500">智能任务调度中心</p>
            </Card>
            <Card className="p-6 bg-slate-800/30 border-slate-800">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-white mb-1">Task Pipeline</h3>
              <p className="text-sm text-slate-500">4 阶段工作流</p>
            </Card>
            <Card className="p-6 bg-slate-800/30 border-slate-800">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold text-white mb-1">Human in Loop</h3>
              <p className="text-sm text-slate-500">人工介入确认</p>
            </Card>
          </div>

          <Button size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
            🚀 View Demo
          </Button>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="py-20 px-6 bg-[#0d1321]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-sky-400 font-mono mb-3">OUR VISION</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              重新定义个人创造力
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: '💻', title: '程序员', desc: 'AI 帮你写代码' },
              { icon: '🎨', title: '设计师', desc: 'AI 帮你做设计' },
              { icon: '📐', title: '产品经理', desc: 'AI 帮你规划功能' },
              { icon: '✍️', title: '知识创作者', desc: 'AI 帮你创作内容' },
            ].map((role) => (
              <Card key={role.title} className="p-6 text-center bg-slate-800/30 border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-4xl mb-4">{role.icon}</div>
                <h3 className="font-semibold text-white mb-2">{role.title}</h3>
                <p className="text-sm text-slate-500">{role.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-sky-400 font-mono mb-3">TASK PIPELINE DEMO</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              任务甬道交互演示
            </h2>
            <p className="text-slate-400">拖拽任务卡片，体验 4 阶段工作流</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <TaskColumn
              title="Todo"
              status="todo"
              icon="📋"
              iconColor="#94a3b8"
              count={todoTasks.length}
              onDrop={(e) => handleDrop(e, 'todo')}
            >
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  tag={task.tag}
                  tagColor={task.tagColor}
                  status={task.status}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TaskColumn>

            <TaskColumn
              title="Plan"
              status="plan"
              icon="📝"
              iconColor="#eab308"
              count={planTasks.length}
              onDrop={(e) => handleDrop(e, 'plan')}
            >
              {planTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  tag={task.tag}
                  tagColor={task.tagColor}
                  status={task.status}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TaskColumn>

            <TaskColumn
              title="Doing"
              status="doing"
              icon="⚡"
              iconColor="#3b82f6"
              count={doingTasks.length}
              onDrop={(e) => handleDrop(e, 'doing')}
            >
              {doingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  tag={task.tag}
                  tagColor={task.tagColor}
                  status={task.status}
                  progress={task.progress}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TaskColumn>

            <TaskColumn
              title="Done"
              status="done"
              icon="✅"
              iconColor="#22c55e"
              count={doneTasks.length}
              onDrop={(e) => handleDrop(e, 'done')}
            >
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  tag={task.tag}
                  tagColor={task.tagColor}
                  status={task.status}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TaskColumn>
          </div>

          {/* AI Assistant */}
          <Card className="mt-8 p-6 max-w-lg mx-auto bg-slate-800/20 border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">AI Assistant</h4>
                <p className="text-sm text-slate-400">
                  💡 建议：当前有 3 个待办任务，建议先将「设计登录页面 UI」移至 Plan 阶段，让我分析需求并生成详细任务清单。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Join */}
      <section id="join" className="py-20 px-6 bg-gradient-to-b from-[#0d1321] to-[#0a0f1e]">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-sky-400 font-mono mb-3">JOIN US</p>
          <h2 className="text-3xl font-bold text-white mb-4">
            一起打造未来工作方式
          </h2>
          <p className="text-slate-400 mb-8">
            XOPC 正在构建 AI 时代的个人生产力操作系统。
            <br />
            加入等待列表，成为早期体验用户。
          </p>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault()
            alert('感谢加入！我们会发送最新动态到你的邮箱。')
          }}>
            <Input
              type="email"
              placeholder="输入你的邮箱"
              className="bg-slate-800/50 border-slate-700"
            />
            <Button className="w-full" size="lg">
              加入等待列表
            </Button>
          </form>
          <p className="text-slate-500 text-sm mt-4">
            已有 <span className="text-sky-400 font-mono">127</span> 人加入
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">XOPC</span>
            <span className="text-slate-500 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">
              Twitter
            </a>
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">
              GitHub
            </a>
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
