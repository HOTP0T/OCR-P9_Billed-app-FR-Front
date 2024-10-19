// src/__tests__/NewBill.js

/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

// Mock the modal method from jQuery
$.fn.modal = jest.fn();

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simulate the user being logged in
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
    // Reset mocks between tests
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered correctly", () => {
      document.body.innerHTML = NewBillUI();
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();
    });

    test("Then handleSubmit should be called when submitting the form", () => {
      document.body.innerHTML = NewBillUI();

      const storeMock = mockStore;
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");

      // Fill in required fields
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

      newBill.fileUrl = "test.jpg";
      newBill.fileName = "test.jpg";

      // Spy on handleSubmit
      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

      formNewBill.addEventListener("submit", newBill.handleSubmit);

      fireEvent.submit(formNewBill);

      expect(handleSubmitSpy).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
    });
  });

  describe("When I upload a file with an incorrect extension", () => {
    test("Then an alert should be displayed and file input should be cleared", () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      // Mock alert
      global.alert = jest.fn();

      const inputFile = screen.getByTestId("file");

      // Simulate a file change event with an incorrect file type
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(global.alert).toHaveBeenCalledWith(
        "Veuillez choisir un fichier ayant une extension jpg, jpeg ou png."
      );
      expect(inputFile.value).toBe("");
    });
  });

  describe("When I upload a file with a correct extension", () => {
    test("Then the file should be sent to the server and fileUrl and fileName should be updated", async () => {
      document.body.innerHTML = NewBillUI();

      const storeMock = mockStore;
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");

      // Mock the store's bills().create method
      storeMock.bills = jest.fn(() => {
        return {
          create: jest.fn().mockResolvedValue({
            fileUrl: "https://localhost/test.png",
            key: "12345",
          }),
          update: jest.fn(),
        };
      });

      // Simulate a file change event with a correct file type
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      // Wait for the asynchronous operation to complete
      await waitFor(() => expect(newBill.fileUrl).toBe("https://localhost/test.png"));
      expect(newBill.fileName).toBe("test.png");
    });
  });
});