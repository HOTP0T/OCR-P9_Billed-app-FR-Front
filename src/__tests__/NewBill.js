/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

// Mock de la méthode modal de jQuery
$.fn.modal = jest.fn();

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simule l'utilisateur connecté dans localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'employee@test.tld',
    }));
    // On simule l'objet onNavigate
    window.onNavigate = jest.fn();
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
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: storeMock, localStorage: window.localStorage });
      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", newBill.handleSubmit);
      
      fireEvent.submit(formNewBill);
      expect(handleSubmitSpy).toHaveBeenCalled();
    });
  });

  describe("When I upload a file with an incorrect extension", () => {
    test("Then an alert should be displayed and file input should be cleared", () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage });

      const handleChangeFileSpy = jest.spyOn(newBill, "handleChangeFile");

      const inputFile = screen.getByTestId("file");
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      
      // Simuler un changement de fichier avec une mauvaise extension
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFileSpy).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Veuillez choisir un fichier ayant une extension jpg, jpeg ou png.");
      expect(inputFile.value).toBe("");
    });
  });

  describe("When I upload a file with a correct extension", () => {
    test("Then the file should be sent to the server and fileUrl and fileName should be updated", async () => {
      document.body.innerHTML = NewBillUI();

      const storeMock = mockStore;
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: storeMock, localStorage: window.localStorage });

      const inputFile = screen.getByTestId("file");
      const file = new File(["test"], "test.png", { type: "image/png" });
      
      const handleChangeFileSpy = jest.spyOn(newBill, "handleChangeFile");

      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFileSpy).toHaveBeenCalled();
      await waitFor(() => expect(newBill.fileUrl).toBe("https://localhost/file.png"));
      expect(newBill.fileName).toBe("test.png");
    });
  });
});