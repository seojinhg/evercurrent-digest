const express = require('express');
const cors = require('cors');
require('dotenv').config();

const messagesRouter = require('./routes/messages');
const ticketsRouter = require('./routes/tickets');
const digestRouter = require('./routes/digest');
const userRouter = require('./routes/user');
const threadRouter = require('./routes/thread');
const silenceRouter = require('./routes/silence');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/messages', messagesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/digest', digestRouter);
app.use('/api/user', userRouter);
app.use('/api/thread', threadRouter);
app.use('/api/silence', silenceRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Build vector
const vectorService = require('./services/vector.service');
const { startScheduler } = require('./services/scheduler.service');
const messages = require('./data/slack-messages.json');
const tickets = require('./data/jira-tickets.json');

app.listen(PORT, async () => {
  console.log(`EverCurrent backend running on port ${PORT}`);
  try {
    await vectorService.buildIndex(messages, tickets);
    startScheduler();
  } catch (err) {
    console.error('Startup failed:', err.message);
  }
});


module.exports = app;