const mongoose = require('mongoose');
mongoose.connect('mongodb://sandhyaw4578_db_user:83P2nVYYcaWLiVtq@ac-amyq2gc-shard-00-00.yawbj60.mongodb.net:27017,ac-amyq2gc-shard-00-01.yawbj60.mongodb.net:27017,ac-amyq2gc-shard-00-02.yawbj60.mongodb.net:27017/yatrigo?ssl=true&authSource=admin&replicaSet=atlas-oprao8-shard-0&appName=Cluster0').then(async () => {
  const Story = require('./models/Story');
  const stories = await Story.find().sort({createdAt: -1}).limit(2);
  console.log("=== LATEST 2 STORIES ===");
  for (let s of stories) {
    console.log(`Story ID: ${s._id}`);
    console.log(`Stickers count: ${s.stickers?.length || 0}`);
    console.log(JSON.stringify(s.stickers, null, 2));
    console.log("----------------------");
  }
  process.exit(0);
});
