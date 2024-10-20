/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

// Mock the modal method from jQuery
$.fn.modal = jest.fn(); // Mocking the modal function used within the application

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simulate the user being logged in with Employee credentials
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
      })
    );
    // Reset all mocks before each test case to ensure clean state
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered correctly", () => {
      // Render the NewBill page UI
      document.body.innerHTML = NewBillUI();
      
      // Verify that the form is rendered
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy(); // Expect the form to be in the document
    });

    test("Then handleSubmit should be called when submitting the form", () => {
      // Render the NewBill page UI
      document.body.innerHTML = NewBillUI();

      const storeMock = mockStore;
      const onNavigate = jest.fn(); // Mock navigation function
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      // Fill out the form with valid input data
      const formNewBill = screen.getByTestId("form-new-bill");
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Test expense" },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "100" },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2021-12-25" },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "20" },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Test commentary" },
      });

      // Set up file information manually for testing
      newBill.fileUrl = "test.jpg";
      newBill.fileName = "test.jpg";

      // Spy on handleSubmit method to ensure it is called
      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

      // Simulate the form submission
      formNewBill.addEventListener("submit", newBill.handleSubmit);
      fireEvent.submit(formNewBill);

      // Verify that handleSubmit was called and onNavigate was triggered
      expect(handleSubmitSpy).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
    });
  });

  describe("When I upload a file with an incorrect extension", () => {
    test("Then an alert should be displayed and file input should be cleared", () => {
      // Render the NewBill page UI
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      // Mock the global alert function
      global.alert = jest.fn();

      const inputFile = screen.getByTestId("file");

      // Simulate uploading a file with an invalid extension (txt file)
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      // Verify that an alert is displayed and the input field is cleared
      expect(global.alert).toHaveBeenCalledWith(
        "Veuillez choisir un fichier ayant une extension jpg, jpeg ou png."
      );
      expect(inputFile.value).toBe(""); // The input field should be cleared
    });
  });

  describe("When I upload a file with a correct extension", () => {
    test("Then the file should be sent to the server and fileUrl and fileName should be updated", async () => {
      // Render the NewBill page UI
      document.body.innerHTML = NewBillUI();

      const storeMock = mockStore;
      const onNavigate = jest.fn(); // Mock navigation function
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");

      // Mock the store method to simulate file upload
      storeMock.bills = jest.fn(() => {
        return {
          create: jest.fn().mockResolvedValue({
            fileUrl: "https://localhost/test.png",
            key: "12345",
          }),
          update: jest.fn(),
        };
      });

      // Simulate uploading a valid image file (png file)
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      // Wait for the asynchronous process to complete
      await waitFor(() => expect(newBill.fileUrl).toBe("https://localhost/test.png"));
      expect(newBill.fileName).toBe("test.png"); // Verify the fileName is updated
    });
  });
});