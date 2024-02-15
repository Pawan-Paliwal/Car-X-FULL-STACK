const Product = require("../models/product");
const { validationResult } = require("express-validator");
const axios = require("axios");
const filehelper = require("../util/file");
const fs = require("fs");
const path = require("path");

exports.getAddProduct = (req, res, next) => {
  async function fetchImageData(query) {
    try {
      const accessKey = "_1ypAV7xQGdIk_QrXcyhQ4D_nQIS-cuqBXyHgyXitaY";
      const apiUrl = "https://api.unsplash.com/photos/random";
      const imageURL = `${apiUrl}?query=${query}&client_id=${accessKey}`;
      const response = await axios.get(imageURL);
      if (response.status === 200) {
        return response.data.urls.full; // Replace 'urls.full' with the actual path to the desired object
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching image data: ${error.message}`);
      throw error;
    }
  }

  async function updateFile() {
    try {
      const p = path.join(
        path.dirname(require.main.filename),
        "Products",
        "products.json"
      ); // replace with the actual path
      const data = await new Promise((resolve, reject) => {
        fs.readFile(p, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      let elements = JSON.parse(data);

      // Iterate through each element in the array
      for (const element of elements) {
        const query = element.Name;
        try {
          const imageURL = await fetchImageData(query);
          element.image = imageURL;
          console.log(`Image URL for ${query}: ${imageURL}`);
        } catch (error) {
          console.error(`Error fetching image for ${query}: ${error.message}`);
        }
      }

      const updatedData = JSON.stringify(elements);
      fs.writeFile(p, updatedData, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log("File updated successfully");
        }
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  // Call the function to update the file
  updateFile();
  // const apiUrl =
  //   "https://api.unsplash.com/photos/random?query=chevy s-10&client_id=ZqwF9tkHc0glv_LpeU9iygzDGIsYaq2t5vMXXzXUcoQ";
  // async function fetchJsonData(apiUrl) {
  //   try {
  //     const response = await axios.get(apiUrl);
  //     return response.data; // The entire JSON response
  //   } catch (error) {
  //     throw new Error(`Error fetching JSON data: ${error.message}`);
  //   }
  // }
  // async function extractObject(apiURL) {
  //   try {
  //     const jsonData = await fetchJsonData(apiURL);
  //     const desiredObject = jsonData.urls.full;
  //     console.log(desiredObject);
  //     return desiredObject;
  //   } catch (error) {
  //     console.error(`Error: ${error.message}`);
  //   }
  // }
  // Call the function to extract the desired object

  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    hasError: false,
    errorMessage: null,
  });
};

// exports.PostToDataBase = (req, res, next) => {

//   // const DataFile = pathData.array.forEach((elem) => {
//   //   if (
//   //     !elem == Product.title &&
//   //     Product.description &&
//   //     Product.imageUrl &&
//   //     Product.price
//   //   ) {
//   //     const error = new Error(err);
//   //     error.httpStatusCode = 500;
//   //     return next(error);
//   //   }
//   //   Product.push(elem);
//   // });
//   // console.log(DataFile);
// };

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;
  const product = new Product({
    // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });
      // res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        hasError: false,
        errorMessage: null,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      hasError: true,
      editing: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        filehelper.deletefile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   Product.deleteOne({ _id: prodId, userId: req.user._id })
//     .then(() => {
//       console.log("DESTROYED PRODUCT");
//       res.redirect("/admin/products");
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.DeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.status(200).json({
        message: "Success",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Deleting Product failed !",
      });
    });
};
