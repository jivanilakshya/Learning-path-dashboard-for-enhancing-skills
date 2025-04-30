import React, { useState, useEffect } from "react";
import Input from "../DocumentVerification/InputComponent/Input.jsx";
import InputUpload from "../DocumentVerification/Inputupload/InputUpload.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { RotatingLines } from "react-loader-spinner";
import logo from "../../Images/logo.svg";
import axios from "axios";

const TeacherDocument = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const { Data } = useParams();
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(`/api/teacher/TeacherDocument/${Data}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const user = await response.json();
        setData(user.data);
      } catch (error) {
        setError(error.message);
      }
    };

    getData();
  }, []);

  const [formData, setFormData] = useState({
    Phone: '',
    Address: '',
    Experience: '',
    UGcollege: '',
    PGcollege: '',
    UGmarks: '',
    PGmarks: '',
  });

  const [files, setFiles] = useState({
    Aadhaar: null,
    Secondary: null,
    Higher: null,
    UG: null,
    PG: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFiles(prevFiles => ({
        ...prevFiles,
        [name]: files[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    
    const formDataToSend = new FormData();
    
    // Append form data
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    // Append files with correct field names
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append(key, file);
      }
    });

    try {
      const response = await axios.post(`/api/teacher/verification/${Data}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        alert('Documents uploaded successfully');
        navigate("/pending");
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.message || 'Failed to upload documents');
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Error setting up the request. Please try again.');
      }
    } finally {
      setLoader(false);
    }
  };

  return (
    <>
      {loader && (
        <div className="absolute top-[40%] left-[45%] translate-x-[50%] translate-y-[50%]">
          <RotatingLines
            visible={true}
            height="100"
            width="100"
            color="#0D286F"
            strokeWidth="5"
            animationDuration="0.75"
            ariaLabel="rotating-lines-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />{" "}
          <span className="text-white text-xl ml-1">Uploading ...</span>
        </div>
      )}
      <div className="flex items-center gap-[20rem] px-32 py-2 bg-[#0D286F]">
        <div className="flex items-center gap-3">
          <img src={logo} className="w-14" alt="" />
          <h1 className="text-2xl text-[#4E84C1] font-bold">Shiksharthee</h1>
        </div>
        <h2 className="text-white text-xl">Document Verification (Teacher) </h2>
      </div>
      <hr />
      <form onSubmit={handleSubmit}>
        <p className="text-[#4E84C1] p-5 px-10">Personal Information</p>
        <div className="flex flex-wrap gap-20 px-36 mb-10">
          <Input
            label={"First Name"}
            placeholder={"First Name"}
            value={data.Firstname}
            readonly
          />
          <Input
            label={"Last Name"}
            placeholder={"Last Name"}
            value={data.Lastname}
            readonly
          />
          <Input
            label={"Phone No."}
            placeholder={"Phone No."}
            value={formData.Phone}
            onChange={handleInputChange}
            name="Phone"
          />
        </div>

        <div className="flex flex-wrap gap-20 px-36">
          <Input
            label={"Home Address"}
            placeholder={"Home Address"}
            value={formData.Address}
            onChange={handleInputChange}
            name="Address"
          />
          <Input
            label={"Experience (years)"}
            placeholder={"Experience (years)"}
            value={formData.Experience}
            onChange={handleInputChange}
            name="Experience"
          />
          <InputUpload
            label={"Upload Aadhar Card"}
            placeholder={"Upload Aadhar Card"}
            onChange={handleFileChange}
            name="Aadhaar"
            value={files.Aadhaar}
          />
        </div>

        <p className="text-[#4E84C1] p-5 px-10 pt-10">Educational Information</p>
        <div className="border h-full mx-36 relative">
          <div className="flex flex-row gap-7">
            <div className="bg-[#0D286F] p-[1rem] m-3 rounded-sm">
              <p className="text-white text-sm">Secondary</p>
            </div>
            <Input
              placeholder={"Secondary School Name"}
              value={formData.SecondarySchool}
              onChange={handleInputChange}
              name="SecondarySchool"
            />
            <Input
              placeholder={"Secondary Marks"}
              value={formData.SecondaryMarks}
              onChange={handleInputChange}
              name="SecondaryMarks"
            />
            <div className="mt-[-1.5rem]">
              <InputUpload
                placeholder={"Upload Secondary Result"}
                onChange={handleFileChange}
                name="Secondary"
                value={files.Secondary}
              />
            </div>
          </div>
          <hr />

          <div className="flex flex-row gap-7">
            <div className="bg-[#0D286F] p-[1rem] m-1 rounded-sm px-4">
              <p className="text-white text-sm">Higher Secondary</p>
            </div>
            <Input
              placeholder={"Higher Secondary School Name"}
              value={formData.HigherSchool}
              onChange={handleInputChange}
              name="HigherSchool"
            />
            <Input
              placeholder={"Higher Secondary Marks"}
              value={formData.HigherMarks}
              onChange={handleInputChange}
              name="HigherMarks"
            />
            <div className="mt-[-1.5rem]">
              <InputUpload
                placeholder={"Upload Higher Secondary Result"}
                onChange={handleFileChange}
                name="Higher"
                value={files.Higher}
              />
            </div>
          </div>
          <hr />

          <div className="flex flex-row gap-7">
            <div className="bg-[#0D286F] p-[1rem] m-3 rounded-sm">
              <p className="text-white text-sm">UG College</p>
            </div>
            <Input
              placeholder={"Graduation University Name"}
              value={formData.UGcollege}
              onChange={handleInputChange}
              name="UGcollege"
            />
            <Input
              placeholder={"UGmarks/SGP out of 10"}
              value={formData.UGmarks}
              onChange={handleInputChange}
              name="UGmarks"
            />
            <div className="mt-[-1.5rem]">
              <InputUpload
                placeholder={"Upload Graduation Result"}
                onChange={handleFileChange}
                name="UG"
                value={files.UG}
              />
            </div>
          </div>
          <hr />

          <div className="flex flex-row gap-7">
            <div className="bg-[#0D286F] p-[1rem] m-1 rounded-sm px-4">
              <p className="text-white text-sm">PG College</p>
            </div>
            <Input
              placeholder={"P.G. University Name"}
              value={formData.PGcollege}
              onChange={handleInputChange}
              name="PGcollege"
            />
            <Input
              placeholder={"CGPA out of 10"}
              value={formData.PGmarks}
              onChange={handleInputChange}
              name="PGmarks"
            />
            <div className="mt-[-1.5rem]">
              <InputUpload
                placeholder={"Upload P.G. Result"}
                onChange={handleFileChange}
                name="PG"
                value={files.PG}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-white text-xl m-5 text-center">!! {error}</p>}
        <div className="bg-[#0D286F] p-3 m-6 rounded-md w-[7rem] ml-[85%] cursor-pointer">
          <button className="text-white text-sm" type="submit">
            Submit ▶️
          </button>
        </div>
      </form>
    </>
  );
};

export default TeacherDocument;
