import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Website is Live");
});

app.post('/individuals', async (req, res) => {
    console.log(req.body);
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO individuals (full_name, email_address, password) VALUES ($1, $2, $3) RETURNING *',
            [full_name, email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/companies', async (req, res) => {
    console.log(req.body);
    const { company_name, company_email, password } = req.body;

    if (!company_email || !company_name || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO companies (company_name, company_email_address, password) VALUES ($1, $2, $3) RETURNING *',
            [company_name, company_email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/IndividualsSignin", async (req, res) => {
    const { username, password } = req.body; // Updated to match request data

    console.log("Received data:", req.body);

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Convert username to lowercase
        const lowerCaseUsername = username.toLowerCase();

        const result = await pool.query("SELECT * FROM individuals WHERE email_address = $1", [lowerCaseUsername]);
        console.log(result.rows);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(user);
            const hashedPassword = user.password;

            // Compare the encrypted password
            const match = await bcrypt.compare(password, hashedPassword);

            if (match) {
                res.json({ firstName: user.firstname });
                console.log("Successful Login");
            } else {
                res.status(401).send("Incorrect Password");
                console.log("Incorrect Password");
            }
        } else {
            res.status(404).send("User not found");
            console.log("User not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

app.post("/CompanySignin", async (req, res) => {
    const { username, password } = req.body; // Updated to match request data

    console.log("Received data:", req.body);

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Convert username to lowercase
        const lowerCaseUsername = username.toLowerCase();

        const result = await pool.query("SELECT * FROM companies WHERE company_email_address = $1", [lowerCaseUsername]);
        console.log(result.rows);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(user);
            const hashedPassword = user.password;

            // Compare the encrypted password
            const match = await bcrypt.compare(password, hashedPassword);

            if (match) {
                res.json({ firstName: user.firstname });
                console.log("Successful Login");
            } else {
                res.status(401).send("Incorrect Password");
                console.log("Incorrect Password");
            }
        } else {
            res.status(404).send("User not found");
            console.log("User not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

app.post('/jobOffers', async (req, res) => {
    const { jobTitle, companyName, description, email, phoneNumber } = req.body;
    console.log(req.body);

    if (!jobTitle || !companyName || !description || !email || !phoneNumber) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const query = `
        INSERT INTO job_offers (job_title, company_name, description, email_address, phone_number)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `;
        const values = [jobTitle, companyName, description, email, phoneNumber];

        const result = await pool.query(query, values);
        const newJobOfferId = result.rows[0].id;

        res.status(201).json({ message: 'Job offer added successfully', id: newJobOfferId });
    } catch (error) {
        console.error('Error inserting job offer:', error);
        res.status(500).json({ error: 'An error occurred while adding the job offer' });
    }
});

app.get('/ListjobOffers', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM job_offers');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      res.status(500).json({ error: 'An error occurred while fetching job offers' });
    }
  });

pool.connect()
    .then(client => {
        return client.query('SELECT NOW()')
            .then(res => {
                console.log('Connection successful:', res.rows);
                client.release();
            })
            .catch(err => {
                client.release();
                console.error('Error executing query:', err);
            });
    })
    .catch(err => console.error('Error acquiring client:', err));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
