const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");




const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/toDoListsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);


const listSchema = mongoose.Schema({
  name: {
    type: String
  }
});

const Item = mongoose.model("Item", listSchema);

const item1 = new Item({
  name: "Cardio"
});

const item2 = new Item({
  name: "Assigments"
});

const item3 = new Item({
  name: "Sleep"
});

const defaultItem = [item1, item2, item3];

const newListSchema = mongoose.Schema({
  name: String,
  List: [listSchema]
})

const List = mongoose.model("List", newListSchema);

app.get("/", function(req, res) {

  Item.find({}, function(error, foundItems) {

    if (!error) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItem, function(error) {
          if (error) {
            console.log(error);
          } else {
            console.log("Successfully inserted all the document");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listHeading: "Today",
          listInput: foundItems
        });
      }
    }
  })
});

app.get("/:customList", function(req, res) {
  const newList = _.capitalize(req.params.customList);
  List.findOne({
    name: newList
  }, function(error, foundItems) {
    if (!error) {
      if (!foundItems) {
        const list = new List({
          name: newList,
          List: defaultItem
        })
        list.save();
        res.redirect("/");
      } else {
        res.render("list", {
          listHeading: foundItems.name,
          listInput: foundItems.List
        });
      }
    }
  })

});


app.post("/", function(req, res) {
  const item = req.body.newItem;
  const listName = req.body.listName;
  const listNewItem = new Item({
    name: item
  });
  if (listName === "Today") {

    listNewItem.save()
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(error, foundItems) {
      if (!error) {
        foundItems.List.push(listNewItem);
        foundItems.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const itemDelete = req.body.itemDelete;
  const listName = req.body.customName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemDelete, function(error) {
      if (!error) {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {List: {_id: itemDelete}}},function(error, foundItems) {
        if (!error) {
          res.redirect("/" + listName);
        }
      });
  }

})

app.listen(3000, function() {
  console.log("Server running on port 3000");
})
