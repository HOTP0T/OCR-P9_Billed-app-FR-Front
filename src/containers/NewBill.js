// src/containers/NewBill.js

import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  // Class NewBill manages the creation of a new bill
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.localStorage = localStorage; // Store localStorage as this.localStorage

    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]` // Form for creating a new bill
    );
    formNewBill.addEventListener("submit", this.handleSubmit);

    const fileInput = this.document.querySelector(`input[data-testid="file"]`); // Input of type file to add an image of the bill
    fileInput.addEventListener("change", this.handleChangeFile);

    // Variables that will be used to store form data
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;

    new Logout({ document, localStorage, onNavigate }); // Call the Logout class to be able to log out
  }

  // Function that handles file upload and sending form data to the server
  handleChangeFile = (e) => {
    e.preventDefault();
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0]; // Get the first file that was added

    const fileName = file.name; // Get the file name from the file object
    const formData = new FormData(); // Create a new FormData object
    const email = JSON.parse(this.localStorage.getItem("user")).email; // Use this.localStorage

    formData.append("file", file); // Append the file to formData
    formData.append("email", email); // Append the email to formData

    // Only accept files with jpg, jpeg, and png extensions
    if (
      !(
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg"
      )
    ) {
      alert("Veuillez choisir un fichier ayant une extension jpg, jpeg ou png.");
      // Clear the file input if the file is not in the correct format
      fileInput.value = "";
      return;
    }

    // Send the file to the server
    if (this.store) {
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          // Store the file URL and name
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
    }
  };

  // Function called when submitting the form
  handleSubmit = (e) => {
    e.preventDefault(); // Prevent the page from refreshing on form submission

    const email = JSON.parse(this.localStorage.getItem("user")).email; // Use this.localStorage

    // Retrieve form data
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(
        `textarea[data-testid="commentary"]`
      ).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    this.updateBill(bill); // Pass bill as parameter to update the bill
    this.onNavigate(ROUTES_PATH["Bills"]); // Navigate to the Bills page
  };

  // Not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}