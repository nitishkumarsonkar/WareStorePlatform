import { Response } from 'express';
import { projectsService } from './projects.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class ProjectsController {
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'builder') {
        return res.status(403).json({ error: 'Only registered builders can create project requisitions.' });
      }
      if (!req.user.profileId) {
        return res.status(400).json({ error: 'Please complete your Builder KYC before creating requisitions.' });
      }

      const {
        category,
        subItem,
        brandPreference,
        quantity,
        unit,
        requirementDate,
        transportNeeded,
        gstNumber,
        notes,
        addressText,
        latitude,
        longitude,
      } = req.body;

      const project = await projectsService.createProject({
        builderId: req.user.profileId,
        category,
        subItem,
        brandPreference,
        quantity: parseFloat(quantity),
        unit,
        requirementDate,
        transportNeeded: transportNeeded === true || transportNeeded === 'true',
        gstNumber,
        notes,
        addressText,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      });

      return res.status(201).json(project);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to create requisition.' });
    }
  }

  async listProjects(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'builder') {
        return res.status(403).json({ error: 'Access restricted to builders.' });
      }
      if (!req.user.profileId) {
        return res.status(200).json([]);
      }

      const status = req.query.status as string;
      const projects = await projectsService.getProjectsByBuilder(req.user.profileId, status);
      return res.status(200).json(projects);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch projects.' });
    }
  }

  async getProjectDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const project = await projectsService.getProjectDetails(id);
      return res.status(200).json(project);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Project not found.' });
    }
  }

  async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const leaderboard = await projectsService.getProjectLeaderboard(id);
      return res.status(200).json(leaderboard);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch bids leaderboard.' });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'builder' || !req.user.profileId) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const { id } = req.params;
      const { status } = req.body;
      if (!['closed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'closed' or 'cancelled'." });
      }

      const updated = await projectsService.updateProjectStatus(id, req.user.profileId, status);
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to update project.' });
    }
  }

  async acceptBid(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'builder' || !req.user.profileId) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const { id } = req.params; // bid id
      const result = await projectsService.acceptBid(id, req.user.profileId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to accept quote.' });
    }
  }
}

export const projectsController = new ProjectsController();
