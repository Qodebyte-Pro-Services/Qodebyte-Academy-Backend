const { Assignment, AssignmentSubmission, CourseModule, sequelize, ProjectSubmission, Project } = require('../models');
const { uploadToCloudinary } = require('../utils/cloudinaryUtil');
const ensureEnrolled = require('../utils/enrolledStudent');
const { sendNotification } = require('./notificationController');


exports.submitAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const student_id = req.user?.user_id;
    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });

    const { assignment_id, file_url } = req.body;
    if (!assignment_id) {
      await t.rollback();
      return res.status(400).json({ message: 'assignment_id is required.' });
    }

    const assignment = await Assignment.findByPk(assignment_id, { transaction: t });
    if (!assignment) {
      await t.rollback();
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const module = await CourseModule.findByPk(assignment.module_id, { transaction: t });
    if (!module) {
      await t.rollback();
      return res.status(404).json({ message: 'Parent module not found.' });
    }

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) {
      await t.rollback();
      return res.status(403).json({ message: 'Not enrolled in this course.' });
    }

    let finalFileUrl = file_url || null;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      finalFileUrl = uploadResult.secure_url;
    }

    if (!finalFileUrl) {
      await t.rollback();
      return res.status(400).json({ message: 'No file provided. Send multipart file or file_url in body.' });
    }



    const submission = await AssignmentSubmission.create(
      {
        student_id,
        assignment_id,
        file_url: finalFileUrl,
      },
      { transaction: t }
    );

    await t.commit();

    
        await sendNotification({
      student_id,
      title: "Assignment Submitted ✅",
      message: "You’ve successfully Submitted Your Assignment. Keep going!",
    });

    return res.status(201).json({ message: 'Assignment submitted.', submission });
  } catch (err) {
    await t.rollback();
    console.error('Submit assignment error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.getAssignmentsByModule = async (req, res) => {
  try {
    const module_id = req.params.module_id || req.query.module_id;
    if (!module_id) return res.status(400).json({ message: 'module_id is required (path or query).' });

    const module = await CourseModule.findByPk(module_id);
    if (!module) return res.status(404).json({ message: 'Module not found.' });

    const student_id = req.user?.user_id  || req.query.user_id;

    const includeSubmission = {
      model: AssignmentSubmission,
      as: 'submissions',
      required: false,
      attributes: ['submission_id', 'student_id', 'file_url', 'grade', 'feedback', 'createdAt', 'updatedAt'],
    };

    if (student_id) {
      includeSubmission.where = { student_id };
    }

    const assignments = await Assignment.findAll({
      where: { module_id },
      include: [includeSubmission],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ module: { module_id: module.module_id, title: module.title }, assignments });
  } catch (err) {
    console.error('Get assignments by module error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.submitProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const student_id = req.user?.user_id;
    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });

    const { project_id, file_url } = req.body;
    if (!project_id) {
      await t.rollback();
      return res.status(400).json({ message: 'project_id is required.' });
    }

    const project = await Project.findByPk(project_id, { transaction: t });
    if (!project) {
      await t.rollback();
      return res.status(404).json({ message: 'Project not found.' });
    }

    const module = await CourseModule.findByPk(project.module_id, { transaction: t });
    if (!module) {
      await t.rollback();
      return res.status(404).json({ message: 'Parent module not found.' });
    }

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) {
      await t.rollback();
      return res.status(403).json({ message: 'Not enrolled in this course.' });
    }

    let finalFileUrl = file_url || null;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      finalFileUrl = uploadResult.secure_url;
    }

    if (!finalFileUrl) {
      await t.rollback();
      return res.status(400).json({ message: 'No file provided. Send multipart file or file_url in body.' });
    }

    
    const submission = await ProjectSubmission.create(
      {
        student_id,
        project_id,
        file_url: finalFileUrl,
      },
      { transaction: t }
    );

    await t.commit();
    
      await sendNotification({
      student_id,
      title: "Project Submitted ✅",
      message: "You’ve successfully Submitted Your Project. Keep going!",
    });


    return res.status(201).json({ message: 'Project submitted.', submission });
  } catch (err) {
    await t.rollback();
    console.error('Submit project error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.getProjectsByModule = async (req, res) => {
  try {
    const module_id = req.params.module_id || req.query.module_id;
    if (!module_id) return res.status(400).json({ message: 'module_id is required (path or query).' });

    const module = await CourseModule.findByPk(module_id);
    if (!module) return res.status(404).json({ message: 'Module not found.' });

    const student_id = req.user?.user_id  || req.query.user_id;

    const includeSubmission = {
      model: ProjectSubmission,
      as: 'submissions',
      required: false,
      attributes: ['project_submission_id', 'student_id', 'file_url', 'grade', 'feedback', 'createdAt', 'updatedAt'],
    };

    if (student_id) {
      includeSubmission.where = { student_id };
    }

    const projects = await Project.findAll({
      where: { module_id },
      include: [includeSubmission],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ module: { module_id: module.module_id, title: module.title }, projects });
  } catch (err) {
    console.error('Get projects by module error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};


exports.getAssignmentSubmission = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });

    const submission_id = req.params.submission_id || req.query.submission_id;
    if (!submission_id) return res.status(400).json({ message: 'submission_id is required (path or query).' });

    const submission = await AssignmentSubmission.findByPk(submission_id, {
      include: [{ model: Assignment, as: 'assignment', attributes: ['assignment_id', 'module_id'] }],
    });

    if (!submission) return res.status(404).json({ message: 'Assignment submission not found.' });

    if (String(submission.student_id) !== String(student_id)) {
      return res.status(403).json({ message: 'Forbidden. Not the owner of this submission.' });
    }

    return res.status(200).json({ submission });
  } catch (err) {
    console.error('Get assignment submission error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

exports.getProjectSubmission = async (req, res) => {
  try {
   const student_id = req.user?.user_id  || req.query.user_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });

    const submission_id = req.params.submission_id || req.query.submission_id;
    if (!submission_id) return res.status(400).json({ message: 'submission_id is required (path or query).' });

    const submission = await ProjectSubmission.findByPk(submission_id, {
      include: [{ model: Project, as: 'project', attributes: ['project_id', 'module_id'] }],
    });

    if (!submission) return res.status(404).json({ message: 'Project submission not found.' });

    if (String(submission.student_id) !== String(student_id)) {
      return res.status(403).json({ message: 'Forbidden. Not the owner of this submission.' });
    }

    return res.status(200).json({ submission });
  } catch (err) {
    console.error('Get project submission error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};