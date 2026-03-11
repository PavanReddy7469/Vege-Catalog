import express from 'express';
import cors from 'cors';

const app = express();

// Use Render's dynamic port or default to 3000 for local dev
const PORT = parseInt(process.env.PORT || '3000', 10); 

// Middleware
app.use(cors()); // Simplified CORS works best for debugging
app.use(express.json({ limit: '50mb' }));

// Mock Database
let vegetables = [
  { 
    id: 1, 
    name: "Organic Carrots", 
    price: 45, 
    description: "Sweet and crunchy root vegetables sourced from Ooty.",
    imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 2, 
    name: "Broccoli", 
    price: 120, 
    description: "Fresh green broccoli heads, high in vitamins.",
    imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 3, 
    name: "Tomato", 
    price: 50, 
    description: "Fresh red Tomatoes",
    imageUrl: "https://images.unsplash.com/photo-1582284540020-8acaf01f344d?auto=format&fit=crop&w=800&q=80" 
  }
];

// Health check route (so you don't see "Cannot GET /")
app.get('/', (req, res) => {
  res.send('✅ VeggieCatalog API is live and running!');
});

// Routes
app.get('/api/vegetables', (req, res) => {
  res.json(vegetables);
});

app.post('/api/vegetables', (req, res) => {
  const newVeg = { ...req.body, id: Date.now() };
  vegetables.push(newVeg);
  res.status(201).json(newVeg);
});

app.delete('/api/vegetables/:id', (req, res) => {
  const id = parseInt(req.params.id);
  vegetables = vegetables.filter(v => v.id !== id);
  res.status(204).send();
});

app.put('/api/vegetables/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const vegetableIndex = vegetables.findIndex(v => v.id === id);
  if (vegetableIndex !== -1) {
    vegetables[vegetableIndex] = { ...vegetables[vegetableIndex], ...req.body, id };
    res.json(vegetables[vegetableIndex]);
  } else {
    res.status(404).json({ error: 'Vegetable not found' });
  }
});

// Determine host based on environment
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, host, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
});