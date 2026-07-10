const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sharjina:sharj@cluster0.siovpga.mongodb.net/betapp?retryWrites=true&w=majority&appName=Cluster0";
const MainUser = require('./model/MainUser');
const Schema = require('./model/Schema');

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");
    
    const bit = await MainUser.findOne({ username: "bit" }).lean();
    console.log("User 'bit':", bit);

    if (bit) {
      const tabNum = parseInt((bit.scheme || "1").replace(/[^0-9]/g, ""), 10) || 1;
      console.log(`Loading scheme for tab ${tabNum}...`);
      const schemas = await Schema.find({ activeTab: tabNum }).lean();
      console.log(`Found ${schemas.length} schemas for tab ${tabNum}`);
      schemas.forEach(s => {
        s.draws.forEach(d => {
          console.log(`Draw: ${d.drawName}`);
          d.schemes.forEach(g => {
            if (g.group.includes("BOX") || g.group.includes("SUPER")) {
              console.log(`  Group: ${g.group}`);
              console.log("  Rows:", g.rows);
            }
          });
        });
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
