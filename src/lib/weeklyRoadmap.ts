

import type { TaskTrack, TaskPriority } from '@/types'

export interface RoadmapTask {
  title: string
  track: TaskTrack
  priority: TaskPriority
  hours: number
  notes: string
}

export interface WeekPlan {
  week: number
  phase: number
  theme: string
  // All tasks for the week — seeder picks subset by day
  tasks: RoadmapTask[]
}

// Day → which tracks to surface (mirrors the weekly schedule)
export const DAY_TRACKS: Record<number, TaskTrack[]> = {
  0: ['German', 'MERN'],                      // Sunday  — review + rest
  1: ['ML', 'German'],                         // Monday  — ML focus
  2: ['Project', 'Backend'],                   // Tuesday — build
  3: ['Cloud', 'Backend'],                     // Wednesday — cloud + backend
  4: ['Project', 'Data'],                      // Thursday — build
  5: ['German', 'MERN'],                       // Friday  — german + finance
  6: ['ML', 'Cloud', 'Project'],              // Saturday — deep sprint
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Weeks 1–8: Foundation
// Sem 4 + Arabic active. MERN freelancing. Python + ML basics.
// ─────────────────────────────────────────────────────────────────────────────
const phase1: WeekPlan[] = [
  {
    week: 1, phase: 1, theme: 'Setup & Python foundations',
    tasks: [
      { title: 'Install Python 3.11, VS Code, and run "Hello World" in a Jupyter notebook', track: 'ML', priority: 'High', hours: 1, notes: 'Use Anaconda or pyenv. Verify: python --version in terminal.' },
      { title: 'Complete NumPy tutorial: arrays, slicing, broadcasting — run 10 exercises', track: 'ML', priority: 'High', hours: 1.5, notes: 'numpy.org/learn or fast.ai Practical Deep Learning Ch0' },
      { title: 'Create GitHub profile README with your 2-year goal and tech stack', track: 'Project', priority: 'High', hours: 0.5, notes: 'Pin the roadmap-os repo. German companies check GitHub.' },
      { title: 'Setup Notion: create 2-yr roadmap board, weekly kanban, project tracker', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Duplicate template or build from scratch. This is your second brain.' },
      { title: 'German A1: learn 20 core vocabulary words, numbers 1–100', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Duolingo + Anki. Add all 20 to Anki deck today.' },
      { title: 'Install Anki, create ML deck, add 10 cards (NumPy concepts)', track: 'Data', priority: 'Medium', hours: 0.5, notes: 'One card per concept: what does np.broadcast do? etc.' },
      { title: 'Write 2 Upwork proposals for MERN gigs (bug fixes or small features)', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Target $20–40/hr. Start small — first review matters most.' },
    ],
  },
  {
    week: 2, phase: 1, theme: 'Pandas + Git + first proposals',
    tasks: [
      { title: 'Pandas: load CSV, groupby, merge, pivot — complete 5 exercises from Kaggle', track: 'ML', priority: 'High', hours: 1.5, notes: 'Use Titanic dataset. Practice: groupby("Pclass")["Survived"].mean()' },
      { title: 'Git: branching, pull requests, merge conflicts — practice on a dummy repo', track: 'Cloud', priority: 'High', hours: 1, notes: 'Create feature branch, make changes, open PR, merge. Do this 3×.' },
      { title: 'REST API design: read REST principles, build a 3-endpoint Express API', track: 'Backend', priority: 'High', hours: 1.5, notes: 'GET /tasks, POST /tasks, DELETE /tasks/:id — no DB yet, in-memory array.' },
      { title: 'SQL basics: SELECT, WHERE, JOIN, GROUP BY — complete SQLZoo tutorial sections 1–4', track: 'Data', priority: 'Medium', hours: 1, notes: 'sqlzoo.net — free browser exercises. No install needed.' },
      { title: 'Project 1 kickoff: create GitHub repo "gdpr-rag-chatbot", write README outline', track: 'Project', priority: 'High', hours: 0.5, notes: 'README: problem, solution, tech stack, GDPR angle. Commit today.' },
      { title: 'German A1: verb conjugation (sein, haben, werden) — write 10 sentences', track: 'German', priority: 'Medium', hours: 0.5, notes: 'ich bin / du bist / er ist. Practice with iTalki free exchange.' },
      { title: 'Send 3 Upwork proposals. Follow up on Week 1 proposals if no reply', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Personalise each one. Mention MERN stack + fast delivery.' },
    ],
  },
  {
    week: 3, phase: 1, theme: 'Visualisation + Docker + first gig',
    tasks: [
      { title: 'Matplotlib + Seaborn: plot 5 chart types (bar, line, scatter, heatmap, violin)', track: 'ML', priority: 'High', hours: 1.5, notes: 'Use Titanic or Iris dataset. Save each chart as PNG. Add to GitHub.' },
      { title: 'Docker: build, run, push image — containerise the Express API from week 2', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Write Dockerfile, docker build, docker run -p 3000:3000. Push to Docker Hub.' },
      { title: 'MongoDB: aggregation pipeline — $match, $group, $project, $sort', track: 'Backend', priority: 'Medium', hours: 1, notes: 'Use MongoDB Atlas free tier or Docker. Aggregate sample_mflix dataset.' },
      { title: 'SQL advanced: subqueries, window functions (ROW_NUMBER, RANK) — SQLZoo sections 5–7', track: 'Data', priority: 'Medium', hours: 1, notes: 'Window functions are asked in every German data engineering interview.' },
      { title: 'Project 1: install LangChain, load a PDF, run first Q&A chain in notebook', track: 'Project', priority: 'High', hours: 1.5, notes: 'pip install langchain langchain-openai. Use any PDF (your uni notes).' },
      { title: 'German A1: reading — translate 5 short German sentences, write 5 of your own', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Use Google Translate to check. Add 10 new Anki cards.' },
      { title: 'Deliver first Upwork gig (or prepare a portfolio MERN project to show)', track: 'MERN', priority: 'High', hours: 1, notes: 'Deliver on time. Ask for a 5-star review — first review is everything.' },
    ],
  },
  {
    week: 4, phase: 1, theme: 'Linear algebra + OOP + vector DB',
    tasks: [
      { title: 'Linear algebra for ML: vectors, dot product, matrix multiply — implement from scratch in NumPy', track: 'ML', priority: 'High', hours: 1.5, notes: '3Blue1Brown "Essence of Linear Algebra" playlist — watch + implement each.' },
      { title: 'Docker Compose: multi-container app (API + MongoDB + Redis) from docker-compose.yml', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'services: api, mongo, redis. Each with ports and volumes configured.' },
      { title: 'Python OOP: classes, inheritance, decorators, async/await — build a Task class', track: 'Backend', priority: 'High', hours: 1, notes: 'Build: Task, TaskList, TaskRepository classes. Use @property decorator.' },
      { title: 'Database normalisation: 1NF, 2NF, 3NF — redesign a bad schema to 3NF', track: 'Data', priority: 'Medium', hours: 1, notes: 'Draw ER diagram on paper or dbdiagram.io. Practice for German interviews.' },
      { title: 'Project 1: add ChromaDB as vector store, embed PDF chunks, test similarity search', track: 'Project', priority: 'High', hours: 1.5, notes: 'pip install chromadb. Store on local disk first (will move to Hetzner later).' },
      { title: 'German A1: conversation — introduce yourself in German (record 60-second voice note)', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Mein Name ist… Ich komme aus Pakistan… Ich bin Student… Ich lerne Deutsch.' },
      { title: 'MERN: pitch a retainer (monthly maintenance) to any past client or connection', track: 'MERN', priority: 'Medium', hours: 0.5, notes: '$100–200/month for bug fixes + small features. Recurring > one-off.' },
    ],
  },
  {
    week: 5, phase: 1, theme: 'Statistics + FastAPI + ETL basics',
    tasks: [
      { title: 'Statistics for ML: probability, Bayes theorem, distributions — implement Gaussian PDF', track: 'ML', priority: 'High', hours: 1.5, notes: 'StatQuest with Josh Starmer on YouTube — watch 3 videos + code along.' },
      { title: 'Docker advanced: multi-stage builds, .dockerignore, health checks', track: 'Cloud', priority: 'Medium', hours: 1, notes: 'Reduce image size from ~800MB to <200MB using multi-stage. Measure it.' },
      { title: 'FastAPI: build first API with JWT auth — register, login, protected /me endpoint', track: 'Backend', priority: 'High', hours: 1.5, notes: 'pip install fastapi uvicorn python-jose[cryptography]. Use /docs for testing.' },
      { title: 'ETL basics: extract CSV, transform (clean nulls, rename cols), load to SQLite', track: 'Data', priority: 'Medium', hours: 1, notes: 'Use pandas + sqlite3. Build a reusable extract_transform_load() function.' },
      { title: 'Project 1: deploy on Hetzner CX11 (€4/mo) — SSH, git pull, run with Docker', track: 'Project', priority: 'High', hours: 1.5, notes: 'Hetzner = German cloud. Data stays in Germany = GDPR compliant. Document this.' },
      { title: 'German A1 → A2: greetings, numbers, time expressions — Duolingo 3 lessons', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Focus: telling time, days of the week, months. All used in work emails.' },
      { title: 'MERN: build a simple portfolio page for Upwork profile (React + Tailwind)', track: 'MERN', priority: 'Medium', hours: 1, notes: 'Projects section + contact form. Deploy to Vercel. Link from Upwork profile.' },
    ],
  },
  {
    week: 6, phase: 1, theme: 'Scikit-learn + AWS + Project 1 live',
    tasks: [
      { title: 'Scikit-learn: train Logistic Regression + Random Forest on Titanic — compare accuracy', track: 'ML', priority: 'High', hours: 1.5, notes: 'sklearn Pipeline: StandardScaler → model. Cross-validate with 5-fold CV.' },
      { title: 'AWS Free Tier: create account, set up IAM user with least-privilege policy', track: 'Cloud', priority: 'High', hours: 1, notes: 'Never use root account. Create admin group, attach AdministratorAccess, create user.' },
      { title: 'Spring Boot intro: create REST controller with GET/POST endpoints (Java)', track: 'Backend', priority: 'Medium', hours: 1.5, notes: 'start.spring.io → Web, Lombok. Build /api/tasks CRUD. Test in Postman.' },
      { title: 'Apache Airflow: install locally via Docker, create first DAG with 3 tasks', track: 'Data', priority: 'Medium', hours: 1, notes: 'DAG: extract_csv → transform → load_to_db. Schedule: @daily.' },
      { title: 'Project 1: add README.de.md (German README), write case study, share on LinkedIn', track: 'Project', priority: 'High', hours: 1, notes: 'Case study: problem, solution, GDPR angle, tech stack. Tag #OpenToWork #ML.' },
      { title: 'German A2: past tense (Perfekt) — write 10 sentences about what you did today', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Ich habe… gelernt. Ich habe… gebaut. Ich habe… geschrieben.' },
      { title: 'MERN: raise Upwork hourly rate to $30/hr. Update profile headline to include AI/ML', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Add "MERN Stack + AI Integration" to title. Update skills section.' },
    ],
  },
  {
    week: 7, phase: 1, theme: 'Scikit-learn pipelines + AWS S3 + Project 1 polish',
    tasks: [
      { title: 'Scikit-learn: cross-validation, GridSearchCV, Pipeline — tune Random Forest hyperparams', track: 'ML', priority: 'High', hours: 1.5, notes: 'param_grid = {n_estimators:[100,200], max_depth:[5,10,None]}. Log best score.' },
      { title: 'AWS S3: create bucket, upload files via CLI and Python boto3', track: 'Cloud', priority: 'High', hours: 1, notes: 'aws s3 cp file.txt s3://my-bucket/. Then boto3.client("s3").upload_file(...)' },
      { title: 'FastAPI + PostgreSQL: full CRUD app with SQLAlchemy ORM', track: 'Backend', priority: 'High', hours: 1.5, notes: 'Models: Task(id, title, status, created_at). Alembic migration. Docker Compose.' },
      { title: 'dbt intro: install, init project, write first model transforming a CSV', track: 'Data', priority: 'Medium', hours: 1, notes: 'pip install dbt-duckdb. dbt init. Write models/stg_tasks.sql. dbt run.' },
      { title: 'Project 1: add conversation memory (ConversationBufferMemory), test multi-turn Q&A', track: 'Project', priority: 'High', hours: 1.5, notes: 'User should be able to ask follow-up questions referencing prior answers.' },
      { title: 'German A2: modal verbs (können, müssen, wollen, sollen) — write 10 sentences', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Ich kann Python programmieren. Ich muss Deutsch lernen. Ich will nach Deutschland.' },
      { title: 'MERN: collect and publish first 5-star Upwork review. Request testimonial', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Ask politely after delivery: "A quick review would help my profile enormously."' },
    ],
  },
  {
    week: 8, phase: 1, theme: 'End-to-end ML + Kafka intro + Project 1 COMPLETE',
    tasks: [
      { title: 'Build complete ML project: Titanic end-to-end — EDA, features, model, evaluation, report', track: 'ML', priority: 'High', hours: 2, notes: 'Jupyter notebook with markdown sections. Push to GitHub. This is portfolio piece.' },
      { title: 'AWS EC2: launch Ubuntu instance, SSH in, install Docker, deploy the FastAPI app', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Free tier t2.micro. Use security group: port 22 (SSH) + 8000 (API) only.' },
      { title: 'Kafka basics: producer/consumer concept — run Kafka in Docker, send 100 messages', track: 'Backend', priority: 'Medium', hours: 1, notes: 'docker run confluentinc/cp-kafka. Python kafka-python producer → consumer.' },
      { title: 'Snowflake free trial: create account, load CSV, run 5 SQL queries', track: 'Data', priority: 'Medium', hours: 1, notes: 'snowflake.com → Start Free. Load Titanic CSV. Practice SELECT + GROUP BY.' },
      { title: 'Project 1 COMPLETE: final polish, record 2-min demo video, publish on LinkedIn', track: 'Project', priority: 'High', hours: 1.5, notes: 'Video: show chatbot answering questions from a PDF. Mention GDPR/Hetzner.' },
      { title: 'German A2: consolidation — read 1 short German text (DW Learn German A2 level)', track: 'German', priority: 'Medium', hours: 0.5, notes: 'learngerman.dw.com — free, structured. Read + answer comprehension questions.' },
      { title: 'MERN: total earnings review. Target $200+ by end of week 8. Plan week 9 gigs', track: 'MERN', priority: 'High', hours: 0.5, notes: 'If < $200: send 5 new proposals today. Review which proposal style worked best.' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Weeks 9–16: Core Build
// Uni ends ~Jul 1 (week 8–9). Full focus. Neural nets. AWS. Projects 2+3.
// ─────────────────────────────────────────────────────────────────────────────
const phase2: WeekPlan[] = [
  {
    week: 9, phase: 2, theme: 'Neural networks + VPC + Project 2 start',
    tasks: [
      { title: 'Neural networks: perceptron, backpropagation — implement XOR solver from scratch in NumPy', track: 'ML', priority: 'High', hours: 2, notes: 'No PyTorch yet. Forward pass → loss → backward → weight update. 100% manual.' },
      { title: 'AWS VPC: create custom VPC, public + private subnets, internet gateway, NAT', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Draw the architecture first. VPC 10.0.0.0/16, public 10.0.1.0/24, private 10.0.2.0/24' },
      { title: 'Spring Boot: service layer, repositories, JPA entities with PostgreSQL', track: 'Backend', priority: 'High', hours: 1.5, notes: 'Entities: Task, User. Repository extends JpaRepository. Service handles business logic.' },
      { title: 'dbt advanced: ref(), sources, schema.yml, tests (unique, not_null)', track: 'Data', priority: 'Medium', hours: 1, notes: 'dbt test runs all tests. Fix any failures. Add descriptions to every model.' },
      { title: 'Project 2 start: Predictive Maintenance — download UCI "Machine Predictive Maintenance" dataset', track: 'Project', priority: 'High', hours: 1, notes: 'archive.ics.uci.edu or Kaggle. EDA: distributions, nulls, correlations. Notebook.' },
      { title: 'German A2 → B1: start HelloTalk — find 1 German language partner, send intro message', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Introduce yourself in German only. Mention you are learning tech vocab.' },
      { title: 'MERN: raise rate to $40/hr. Target $400 total by end of phase 2', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Update Upwork profile. Apply to 3 larger projects ($500+ budget).' },
    ],
  },
  {
    week: 10, phase: 2, theme: 'PyTorch tensors + RDS + sensor model',
    tasks: [
      { title: 'PyTorch: tensors, autograd, first neural net — replicate XOR solver with PyTorch', track: 'ML', priority: 'High', hours: 2, notes: 'torch.tensor, requires_grad=True, loss.backward(), optimizer.step(). Compare to NumPy version.' },
      { title: 'AWS RDS: launch PostgreSQL managed instance, connect from EC2, run queries', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'db.t3.micro free tier. Security group: only allow EC2 private IP. Never expose publicly.' },
      { title: 'Spring Boot: exception handling (@ControllerAdvice), input validation (@Valid)', track: 'Backend', priority: 'Medium', hours: 1, notes: 'Custom exceptions: TaskNotFoundException, ValidationException. Return structured error JSON.' },
      { title: 'Apache Airflow: schedule a DAG that loads new CSV files daily from S3', track: 'Data', priority: 'Medium', hours: 1, notes: 'S3Hook + PythonOperator. Trigger on file arrival or @daily. Log success/failure.' },
      { title: 'Project 2: build time-series anomaly detection — IsolationForest on sensor data', track: 'Project', priority: 'High', hours: 1.5, notes: 'Features: temperature, rotational_speed, torque, tool_wear. Score anomalies 0–1.' },
      { title: 'German B1: tech vocabulary — learn 20 German tech terms (Daten, Algorithmus, Entwickler)', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Make Anki cards. German job postings use these daily. Must know them.' },
      { title: 'MERN: build reusable component library (Button, Modal, Table) — publish to npm', track: 'MERN', priority: 'Medium', hours: 1, notes: 'Even a simple npm package shows initiative. 5 components is enough.' },
    ],
  },
  {
    week: 11, phase: 2, theme: 'Training loop + Lambda + streaming project',
    tasks: [
      { title: 'PyTorch: training loop, loss functions, optimizers — train MNIST classifier (>98% acc)', track: 'ML', priority: 'High', hours: 2, notes: 'CrossEntropyLoss + Adam. Plot train/val loss curves. Save model with torch.save().' },
      { title: 'AWS Lambda + API Gateway: deploy a Python function triggered by HTTP POST', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Function: process JSON body, return transformed result. No EC2 needed.' },
      { title: 'Spring Boot + Kafka: async messaging — producer sends task events, consumer processes', track: 'Backend', priority: 'High', hours: 1.5, notes: '@KafkaListener, KafkaTemplate. Topic: task-events. Consumer logs each message.' },
      { title: 'dbt + Airflow: integrate — Airflow DAG triggers dbt run after data lands', track: 'Data', priority: 'Medium', hours: 1, notes: 'BashOperator: dbt run --profiles-dir /path. Or use dbt-airflow provider.' },
      { title: 'Project 2: add FastAPI wrapper around the anomaly model — POST /predict endpoint', track: 'Project', priority: 'High', hours: 1.5, notes: 'Input: sensor readings JSON. Output: {anomaly: bool, score: float, explanation: str}' },
      { title: 'German B1: grammar — relative clauses (der/die/das + Relativsatz)', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Das ist die Firma, die KI entwickelt. Practice 10 sentences. Common in German tech JDs.' },
      { title: 'MERN: build AI-powered MERN app (add GPT/Claude API to a React app) for portfolio', track: 'MERN', priority: 'High', hours: 1, notes: 'Simple: chat UI + backend route calling Claude API. Deploy to Vercel.' },
    ],
  },
  {
    week: 12, phase: 2, theme: 'CNNs + CloudFormation + Project 3 start',
    tasks: [
      { title: 'CNNs: convolution, pooling, architecture — implement LeNet-5 in PyTorch on CIFAR-10', track: 'ML', priority: 'High', hours: 2, notes: 'Conv2d, MaxPool2d, ReLU, Linear. Train 10 epochs. Achieve >65% accuracy.' },
      { title: 'AWS CloudFormation: write IaC template creating VPC + EC2 + Security Group', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'YAML template. aws cloudformation deploy. Delete stack after (costs money if left).' },
      { title: 'Microservices: design patterns — API gateway, service discovery, circuit breaker (theory)', track: 'Backend', priority: 'Medium', hours: 1, notes: 'Read: microservices.io patterns. Draw a microservices architecture for a task manager.' },
      { title: 'Snowflake advanced: clustering, data sharing, time travel — run examples', track: 'Data', priority: 'Medium', hours: 1, notes: 'Time travel: SELECT * FROM table AT(TIMESTAMP => ...). Undrop table. Mind-blowing.' },
      { title: 'Project 3 start: Multi-tenant SaaS on AWS — create repo, architecture diagram', track: 'Project', priority: 'High', hours: 1, notes: 'Architecture: React → API Gateway → Lambda → RDS. Draw with draw.io or Excalidraw.' },
      { title: 'German: register for Goethe Institut A2 or B1 exam — book the date', track: 'German', priority: 'High', hours: 0.25, notes: 'goethe.de — find nearest test center. B1 target: Week 34. Book now.' },
      { title: 'MERN: $600 total milestone check. If behind: send 10 proposals this week', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Track every dollar in Notion. This pays for certs and relocation later.' },
    ],
  },
  {
    week: 13, phase: 2, theme: 'RNNs + Terraform + Project 2 deploy',
    tasks: [
      { title: 'RNNs + LSTMs: sequence modelling — build LSTM for time-series prediction in PyTorch', track: 'ML', priority: 'High', hours: 2, notes: 'Predict next value in sine wave. Then try stock prices (yfinance). Plot predictions.' },
      { title: 'Terraform: write first .tf file — provision EC2 + S3 bucket + security group', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'resource "aws_instance" "app" { ami = ... }. terraform init → plan → apply → destroy.' },
      { title: 'Spring Boot security: JWT authentication — login returns token, /api/* requires it', track: 'Backend', priority: 'High', hours: 1.5, notes: 'spring-boot-starter-security + jjwt. UsernamePasswordAuthenticationFilter override.' },
      { title: 'dbt: data quality tests, dbt_expectations package, CI pipeline in GitHub Actions', track: 'Data', priority: 'Medium', hours: 1, notes: 'Test: expect_column_values_to_not_be_null, expect_column_to_be_unique. Fail CI if broken.' },
      { title: 'Project 2: add Streamlit dashboard, deploy to Hetzner with Docker Compose', track: 'Project', priority: 'High', hours: 1.5, notes: 'Dashboard: real-time anomaly chart, last 100 readings, anomaly count. GDPR note in footer.' },
      { title: 'German B1: reading — read 1 full article from Deutsche Welle (slow German)', track: 'German', priority: 'Medium', hours: 0.5, notes: 'learngerman.dw.com/en/slow-news. Underline unknown words. Add 10 to Anki.' },
      { title: 'MERN: pitch "AI-powered web app" service at $800. Cold email 5 local businesses', track: 'MERN', priority: 'High', hours: 0.5, notes: '"I can add an AI chatbot to your website for $800." Simple, concrete offer.' },
    ],
  },
  {
    week: 14, phase: 2, theme: 'Transformers + Terraform modules + Project 2 blog',
    tasks: [
      { title: 'Transformers: self-attention, multi-head attention — implement scaled dot-product attention', track: 'ML', priority: 'High', hours: 2, notes: 'Implement from "Attention is All You Need". Q, K, V matrices. Visualise weights.' },
      { title: 'Terraform: modules, remote state (S3 backend), variables, outputs', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Move EC2 + VPC into a module. State in S3 + DynamoDB locking. Team-safe.' },
      { title: 'gRPC: protocol buffers, service definition — build a gRPC task service in Python', track: 'Backend', priority: 'Medium', hours: 1.5, notes: 'tasks.proto → python-grpc compile → TaskService(tasks_pb2_grpc). Faster than REST.' },
      { title: 'Apache Spark intro: RDDs, DataFrames, transformations vs actions', track: 'Data', priority: 'High', hours: 1, notes: 'PySpark: SparkSession, read.csv, filter, groupBy, agg. Run locally in Docker.' },
      { title: 'Project 2 blog: write 1000-word technical post on Medium/Dev.to with results', track: 'Project', priority: 'High', hours: 1, notes: 'Title: "Building a Predictive Maintenance System with Python and scikit-learn".' },
      { title: 'German B1: speaking — book first iTalki lesson ($10–15). Topic: introduce yourself', track: 'German', priority: 'High', hours: 1, notes: 'italki.com. Book community tutor (cheaper). Speak only German for 30 min.' },
      { title: 'MERN: sell MERN starter kit template for $49 on Gumroad', track: 'MERN', priority: 'Medium', hours: 1, notes: 'Package your best project as a starter. Gumroad setup takes 30 min. Passive.' },
    ],
  },
  {
    week: 15, phase: 2, theme: 'HuggingFace + Kubernetes local + Project 3 auth',
    tasks: [
      { title: 'HuggingFace: pipelines, tokenizers, load pretrained BERT for sentiment analysis', track: 'ML', priority: 'High', hours: 2, notes: 'from transformers import pipeline. sentiment = pipeline("sentiment-analysis"). Test 20 reviews.' },
      { title: 'Kubernetes local: minikube or kind — pods, deployments, services, kubectl basics', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'Deploy the FastAPI app as a k8s Deployment. Expose with NodePort Service. Scale to 3 replicas.' },
      { title: 'Spring Boot + gRPC: call the Python gRPC service from Java — end to end', track: 'Backend', priority: 'Medium', hours: 1.5, notes: 'Polyglot microservices: Java API Gateway → Python ML service via gRPC.' },
      { title: 'Spark: transformations, actions, joins, partitioning — process 1M row CSV', track: 'Data', priority: 'Medium', hours: 1, notes: 'Generate 1M rows with Faker. Measure time with/without partitioning. Big difference.' },
      { title: 'Project 3: add multi-tenant auth with Clerk or Auth0 — users see only their data', track: 'Project', priority: 'High', hours: 1.5, notes: 'clerk.dev free tier. Middleware checks tenant_id on every request. RLS in database.' },
      { title: 'German B1: 500 words milestone — export Anki deck, count unique words, celebrate', track: 'German', priority: 'Medium', hours: 0.5, notes: 'If under 500: add 20 words/day this week. Focus on tech + daily life vocab.' },
      { title: 'MERN: $1000 total earnings milestone — record it, celebrate, reinvest in a cert', track: 'MERN', priority: 'High', hours: 0.5, notes: 'First $1000 is hardest. Screenshot the Upwork dashboard. Reinvest $300 in AWS SAA exam.' },
    ],
  },
  {
    week: 16, phase: 2, theme: 'LoRA theory + EKS + Project 3 billing',
    tasks: [
      { title: 'Fine-tuning theory: LoRA, PEFT — read the LoRA paper, implement LoRA layer in PyTorch', track: 'ML', priority: 'High', hours: 2, notes: 'arxiv.org/abs/2106.09685. Implement: low-rank decomposition of weight matrix. 50 lines.' },
      { title: 'AWS EKS: managed Kubernetes — deploy app to EKS, compare to local k8s', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'eksctl create cluster. Deploy same YAML as local. Costs money — delete after (~$0.10/hr).' },
      { title: 'Java reactive programming: WebFlux, Project Reactor — build non-blocking API', track: 'Backend', priority: 'Medium', hours: 1.5, notes: 'Mono, Flux, flatMap. Same Task API but reactive. 10× more scalable.' },
      { title: 'Spark + S3: data lake pattern — read/write Parquet from S3 in PySpark', track: 'Data', priority: 'Medium', hours: 1, notes: 'df.write.parquet("s3a://bucket/tasks/"). Partition by date. Read with predicate pushdown.' },
      { title: 'Project 3: Stripe billing — subscription tiers ($0 free, $29 pro), webhook handler', track: 'Project', priority: 'High', hours: 1.5, notes: 'stripe.com test mode. Webhook: checkout.session.completed → activate subscription in DB.' },
      { title: 'German B1: consolidation — all tenses reviewed, write 1 page diary entry in German', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Heute habe ich… (Perfekt). Gestern war ich… (Präteritum). Morgen werde ich… (Futur).' },
      { title: 'Notion: Phase 2 retrospective — what worked, what did not, adjust Phase 3 plan', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Revenue total? Streak length? Projects done? Certs progress? Adjust weekly hours.' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3+ — Weeks 17–104: Specialise → Senior → Germany → Top 0.1%
// Full plans for weeks 17–30 included; 31+ generated by AI agent with context
// ─────────────────────────────────────────────────────────────────────────────
const phase3partial: WeekPlan[] = [
  {
    week: 17, phase: 3, theme: 'Fine-tune Mistral + Helm + GDPR architecture',
    tasks: [
      { title: 'Fine-tune Mistral 7B with LoRA on a custom dataset using PEFT + transformers', track: 'ML', priority: 'High', hours: 2.5, notes: 'Use Colab Pro or RunPod ($0.20/hr). Dataset: 500 Q&A pairs from your domain.' },
      { title: 'Kubernetes Helm: install Helm, deploy an app with a Helm chart, customise values.yaml', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'helm install my-app ./chart. Override values: replicas, image, ingress host.' },
      { title: 'Microservices: saga pattern, outbox pattern — implement for Project 3 orders', track: 'Backend', priority: 'High', hours: 1.5, notes: 'Saga: chain of local transactions. Outbox: events stored in DB, polled by consumer.' },
      { title: 'GDPR-compliant architecture: data residency, right-to-erasure, anonymisation patterns', track: 'Data', priority: 'High', hours: 1.5, notes: 'Document: where is PII stored? How is it encrypted? How can a user delete their data?' },
      { title: 'Project 3: add Terraform IaC for all infra, GitHub Actions CI/CD pipeline', track: 'Project', priority: 'High', hours: 1.5, notes: 'Push → GitHub Actions → terraform plan → (approve) → terraform apply → deploy.' },
      { title: 'German B1: passive voice — Deutsch wird in Deutschland gesprochen. 10 sentences', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Technical writing uses passive a lot. Practice in German and English.' },
      { title: 'MERN: raise rate to $50/hr. Pitch "ML + MERN" combo service to 5 German agencies', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Google: "German digital agency" → find email → personalised pitch in English.' },
    ],
  },
  {
    week: 18, phase: 3, theme: 'HuggingFace publish + ArgoCD + MLflow',
    tasks: [
      { title: 'Publish fine-tuned model to HuggingFace Hub with a detailed model card', track: 'ML', priority: 'High', hours: 1.5, notes: 'Model card: training data, hyperparams, eval results, limitations, GDPR note.' },
      { title: 'GitOps with ArgoCD: install, connect to GitHub repo, auto-sync k8s manifests', track: 'Cloud', priority: 'High', hours: 1.5, notes: 'kubectl apply -f argocd-install.yaml. Add app pointing to your k8s YAML folder.' },
      { title: 'Distributed tracing: add Jaeger to the microservices — trace requests across services', track: 'Backend', priority: 'Medium', hours: 1.5, notes: 'OpenTelemetry SDK → Jaeger. View waterfall trace: API → auth → DB. Find bottlenecks.' },
      { title: 'MLflow: track experiments, log metrics, register model — run 5 experiments', track: 'Data', priority: 'High', hours: 1.5, notes: 'mlflow.start_run(). log_param("lr", 0.001). log_metric("acc", 0.95). register_model().' },
      { title: 'Project 4 start: LLM fine-tuning pipeline — design architecture, create repo', track: 'Project', priority: 'High', hours: 1, notes: 'Pipeline: raw data → cleaning → formatting → fine-tune → eval → HuggingFace push.' },
      { title: 'German B1: writing — draft a professional email in German requesting information', track: 'German', priority: 'Medium', hours: 0.5, notes: 'Sehr geehrte Damen und Herren, ich schreibe Ihnen bezüglich… Formal German is different.' },
      { title: 'MERN: cold email 10 German-speaking companies (Switzerland, Austria, Germany)', track: 'MERN', priority: 'High', hours: 0.5, notes: 'Personalise: mention their product. Offer a specific improvement. 3 sentences max.' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — merge all phases
// For weeks beyond what is defined here, the AI Agent generates tasks
// ─────────────────────────────────────────────────────────────────────────────
export const WEEKLY_ROADMAP: WeekPlan[] = [
  ...phase1,
  ...phase2,
  ...phase3partial,
]

/**
 * Get all tasks for a given week from the static roadmap.
 * Returns the full week plan or null if the week is not pre-defined
 * (AI Agent handles those weeks dynamically).
 */
export function getWeekPlan(weekNum: number): WeekPlan | null {
  return WEEKLY_ROADMAP.find(w => w.week === weekNum) ?? null
}

/**
 * Get today's tasks for a given week, filtered by day-of-week focus.
 * Monday = ML focus → returns ML + 1 other track task
 * Saturday = deep sprint → returns ML + Cloud + Project tasks
 * etc.
 */
export function getDailyTasks(weekNum: number, dayOfWeek: number): RoadmapTask[] {
  const plan = getWeekPlan(weekNum)
  if (!plan) return []

  const priorityTracks = DAY_TRACKS[dayOfWeek] ?? ['ML', 'Project']

  // 1. Primary: tasks matching today's focus tracks
  const primary = plan.tasks.filter(t => priorityTracks.includes(t.track))

  // 2. Always include 1 high-priority task from any track (if not already)
  const highPriority = plan.tasks.filter(
    t => t.priority === 'High' && !primary.includes(t)
  ).slice(0, 1)

  // 3. On weekdays with <3 primary tasks, add 1 extra
  const all = [...primary, ...highPriority]
  if (all.length < 3) {
    const extra = plan.tasks.find(t => !all.includes(t))
    if (extra) all.push(extra)
  }

  return all.slice(0, 5) // never more than 5 tasks auto-seeded
}