//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to MongoDB
mongoose.connect("mongodb+srv://admin-zakiyyah:test123@cluster0.kegzd.mongodb.net/todolistDB",{useNewUrlParser : true});

// create schema
const itemsSchema = {
  name : String
};

// create model
const Item = mongoose.model("Item", itemsSchema);

//mongoose document
const item1 = new Item ({
  name : "Welcome to your to do list!"
});

const item2 = new Item ({
  name:"Hit the + button to add a new item."
});

const item3 = new Item ({
  name:"<--Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

//schema
const listSchema = {
  name : String,
  items : [itemsSchema]
};

//model
const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
    if(foundItems.length === 0){
    Item.insertMany(defaultItems, function(err){
    if(err){
    console.log(err);
    }else{
    console.log("Successfully saved default items to DB");
    }
});
res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});

    }
   
  });


});

//dynamic route that user can type in
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList){
    if (!err){
      //create a new list
      if (!foundList){
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      }else{
        //show an existing list
        res.render("list",{listTitle:foundList.name, newListItems: foundList.items});
      }
    }

  });

  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name : itemName
  });

  if(listName === "Today"){
  item.save();
  res.redirect("/");
  } else {
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

  
});




 app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });

  } else {
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}},function(err){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});
 

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started successfully.");
});
