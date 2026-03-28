import React, { useState } from "react";
import { X, Upload, Loader2, CheckCircle, FileText } from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";

const ApplyModal = ({ job, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [score, setScore] = useState(null);

 

  const handleApply = async () => {
    if (!file) return toast.error("Upload resume (PDF)");

    if (file.type !== "application/pdf") {
      return toast.error("Only PDF allowed");
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const { data } = await API.post(
        `/applications/apply/${job._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      setScore(data.application.fitmentScore);
      setIsSuccess(true);

if (onSuccess) {
  onSuccess(); 
}

toast.success("Application submitted successfully");

      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Apply failed");
    } finally {
      setUploading(false);
    }
  };

 

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={!uploading ? onClose : undefined}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >

        
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {job?.title}
            </h3>
            <p className="text-[11px] text-gray-400">
              Apply with AI evaluation
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">

          {isSuccess ? (
            <div className="text-center">

              <CheckCircle className="mx-auto text-green-500 mb-3" size={36} />

              <p className="font-semibold text-gray-800">
                Application submitted
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Your profile has been evaluated
              </p>

              <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">
                  AI Fitment Score
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {score}%
                </p>
              </div>

            </div>

          ) : (
            <div className="space-y-5">

              
              <div
                onClick={() =>
                  !uploading &&
                  document.getElementById("resume-upload").click()
                }
                className={`border rounded-lg p-6 text-center cursor-pointer transition ${
                  file
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="text-blue-600 mb-2" size={24} />
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ready to upload
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-gray-600">
                      Upload Resume (PDF)
                    </p>
                  </div>
                )}
              </div>

              
              <button
                onClick={handleApply}
                disabled={uploading || !file}
                className={`w-full py-3 rounded-lg text-sm font-medium transition ${
                  uploading || !file
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Analyzing...
                  </span>
                ) : (
                  "Apply Now"
                )}
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ApplyModal;