# Chatbot MVP Implementation Guide

## Overview
This chatbot system provides automated order status support with WhatsApp integration. It handles customer inquiries, creates tickets for sellers, and manages the entire conversation flow.

## Architecture

### Core Components
1. **NLU Service** (`lib/nlu/`) - Intent detection and entity extraction
2. **Order Service** (`lib/services/order-service.ts`) - Order data management
3. **Ticket Service** (`lib/services/ticket-service.ts`) - Support ticket management
4. **WhatsApp Integration** (`lib/whatsapp/`) - Meta WhatsApp Business API
5. **Queue Worker** (`app/api/chatbot/queue/`) - Timeout and reminder processing

### Database Schema
- `buyers` - Customer information and WhatsApp opt-in
- `sellers_extended` - Seller WhatsApp business numbers
- `orders_extended` - Order ETA and tracking information
- `tickets` - Support tickets and their states
- `messages` - All conversation messages

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:
```bash
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# OpenAI API for NLU
OPENAI_API_KEY=your_openai_api_key

# Cron Job Security
CRON_SECRET=your_cron_secret_key
```

### 2. WhatsApp Business API Setup
1. Create a Meta Business account
2. Set up WhatsApp Business API
3. Get your Phone Number ID and Access Token
4. Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
5. Set webhook verify token

### 3. Database Migration
Run the database migration to create chatbot tables:
```bash
npm run db:migrate
```

### 4. OpenAI API Setup
1. Get OpenAI API key
2. Ensure you have credits for GPT-4o-mini usage

## API Endpoints

### WhatsApp Webhook
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Handle incoming messages

### Chat Web Interface
- `POST /api/chat/webhook` - Handle web chat messages
- `GET /api/chat/session/{session_id}` - Get chat history

### Queue Management
- `POST /api/chatbot/queue/process` - Process queue tasks
- `GET /api/chatbot/queue/stats` - Get queue statistics

### Cron Jobs
- `POST /api/cron/chatbot-queue` - Runs every 15 minutes

## Flow Examples

### Customer Asks About Order Status
1. Customer sends: "Cât mai durează comanda #1234?"
2. NLU detects `order_status` intent, extracts order ID
3. System searches for order in database
4. If ETA exists: Respond immediately with status
5. If no ETA: Create ticket, send WhatsApp to seller, confirm to customer

### Seller Responds with ETA
1. Seller sends: "Mâine după 14"
2. System parses Romanian ETA format
3. Updates order with ETA
4. Notifies customer (if WhatsApp opt-in)
5. Closes ticket

### Timeout Handling
1. Queue worker runs every 15 minutes
2. Checks tickets waiting > 2 hours
3. Sends reminder to seller
4. After 6 hours: Escalates to support

## Message Templates

### To Customer
- Order found with ETA: "Comanda #1234: livrare estimată mâine 14:00–18:00"
- Order not found: "Nu găsesc comanda #1234. Îmi dai emailul sau telefonul?"
- Waiting for seller: "Întrebăm vânzătorul și revenim imediat"

### To Seller
- ETA request: "Salut {Seller}, clientul întreabă ETA pentru #1234. Răspunde aici."
- Reminder: "Reminder: Clientul încă așteaptă ETA pentru #1234"

## Romanian ETA Parsing
The system understands these formats:
- "azi" → "azi"
- "mâine" → "mâine"
- "mâine după 14" → "mâine după 14:00"
- "azi până la 18:00" → "azi până la 18:00"
- "3-5 zile" → "3-5 zile"

## Testing

### Test Customer Flow
1. Send WhatsApp message: "Status comanda #1234"
2. Check if ticket is created
3. Verify seller receives WhatsApp
4. Respond as seller: "mâine după 14"
5. Verify customer gets update

### Test Queue Worker
1. Create a ticket manually
2. Wait 2+ hours
3. Check `/api/chatbot/queue/stats`
4. Verify reminder is sent

## Monitoring

### Key Metrics
- Tickets created per day
- Average response time
- Escalation rate
- Customer satisfaction

### Logs to Monitor
- WhatsApp API errors
- NLU confidence scores
- Queue worker execution
- Database errors

## Security Considerations

### Rate Limiting
- 5 messages per minute per customer
- WhatsApp API rate limits respected

### Data Privacy
- Only store necessary data
- WhatsApp opt-in required for notifications
- GDPR compliance for EU customers

### Webhook Security
- Verify webhook signatures
- Use HTTPS only
- Validate all inputs

## Troubleshooting

### Common Issues
1. **WhatsApp messages not sending**
   - Check API credentials
   - Verify phone number format
   - Check rate limits

2. **NLU not detecting intents**
   - Check OpenAI API key
   - Review example training data
   - Fallback to rule-based detection

3. **Tickets not being created**
   - Check database connection
   - Verify order exists
   - Check seller WhatsApp number

### Debug Endpoints
- `/api/chatbot/queue/stats` - Queue status
- `/api/whatsapp/webhook` - Webhook logs
- Database queries for ticket states

## Future Enhancements

### Phase 2 Features
- Multi-language support
- Voice message handling
- Image recognition for order tracking
- Integration with shipping APIs
- Customer satisfaction surveys

### Scalability
- Redis for session storage
- Message queue (Bull/BullMQ)
- Horizontal scaling with load balancers
- Database read replicas

## Support
For technical issues:
- Check logs in Vercel dashboard
- Monitor WhatsApp Business API status
- Review OpenAI API usage
- Database query performance
