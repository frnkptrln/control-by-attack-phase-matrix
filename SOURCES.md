# Sources used by the team (public URLs; full reproductions live in Frank's Claude project, not in this package)

Sprint page: https://apartresearch.com/sprints/ai-incident-response-sprint-2026-09-11-to-2026-09-13 — five tracks; Track 5 bar: "an artifact somebody can use, a stated limit on what it establishes, and what a month of follow-up would add"; Track 2 bar: "resolvable questions, checks somebody could run tomorrow, and causal explanations that predict something"; Track 1 bar: "could a third party verify compliance without access to the lab's network, and would a lab actually adopt it."

Primary and near-primary accounts of the incident
1. Hugging Face, technical timeline (27 Jul 2026): https://huggingface.co/blog/agent-intrusion-technical-timeline
2. OpenAI, incident account (21 Jul, updates 28/29 Jul, 26 Aug): https://openai.com/index/hugging-face-model-evaluation-security-incident/
3. Hugging Face, disclosure (16 Jul): https://huggingface.co/blog/security-incident-july-2026
4. OpenAI, "The Hugging Face incident and the road ahead" (26 Aug): https://openai.com/index/hugging-face-incident-and-the-road-ahead/
5. METR & Redwood Research, independent investigation (26 Aug, 91 pp): https://metr.org/hugging-face-incident-report-aug-2026.pdf
6. OpenAI, "Path to Astra" (1 Sep) with the technical report: https://openai.com/index/path-to-astra/
7. OpenAI, "Safety and alignment in an era of long-horizon models" (20 Jul): https://openai.com/index/safety-alignment-long-horizon-models/
8. CeSIA, "what we know, what we don't, what follows": https://cesia.org/en/publications/the-openai-hugging-face-incident-what-we-know-what-we-dont-what-follows/
9. JFrog/OpenAI Artifactory zero-days: https://jfrog.com/blog/jfrog-and-openai-collaboration-on-zero-day-security-findings/

Policy and discussion
10. SaferAI open letter (9 Jul): https://www.safer-ai.org/u/2026/07/Open-Letter.pdf
11. "Harmonizing AI Safety Thresholds": https://arxiv.org/abs/2607.16112
12. AI Kill Switch Act press release: https://lieu.house.gov/media-center/press-releases/reps-lieu-and-moran-introduce-bill-require-kill-switch-ai-systems-can
13. OpenAI Preparedness Framework v2: https://openai.com/index/updating-our-preparedness-framework/
14. LessWrong, "The current bottleneck is political will, not research": https://www.lesswrong.com/posts/EexsebbYhbe2gXkPP/the-current-bottleneck-is-political-will-not-research
15. LessWrong, "What convincing warning shot could help prevent extinction": https://www.lesswrong.com/posts/RYx6cLwzoajqjyB6b/what-convincing-warning-shot-could-help-prevent-extinction
16. LessWrong, "…but have the weights left the server?": https://www.lesswrong.com/posts/EDQE3fgFyxW7H6sy6/but-have-the-weights-left-the-server
17. LessWrong, "OpenAI has already ended an internal pause": https://www.lesswrong.com/posts/k3eKqKzq4Y7xnqEfZ/openai-has-already-ended-an-internal-pause
18. Charbel-Raphaël, crisis-comms sketch (shortform): https://www.lesswrong.com/posts/yeDSLRArinWqt5Mnf/charbel-raphael-s-shortform?commentId=zTtgHe2zXGoD6L2Dz
19. @DKokotajlo thread with sprint ideas: https://x.com/DKokotajlo/status/2088004964077670494

Literature the papers lean on
20. De Marzo, Bellina, Castellano, Priesemann & Garcia (2026), Conformity Generates Collective Misalignment in AI Agents Societies: https://arxiv.org/abs/2605.10721
21. Shekkizhar et al. (2026), Echoing: https://arxiv.org/abs/2511.09710
22. CodeCRDT https://arxiv.org/abs/2510.18893 · SwarmWorld https://arxiv.org/abs/2608.26081 · CASE framework https://arxiv.org/abs/2608.10153
23. Cheng et al. (2026), Science 391(6792), sycophancy: https://doi.org/10.1126/science.aec8352 · Sharma et al. (2023): https://arxiv.org/abs/2310.13548 · Peacemaker or Troublemaker: https://arxiv.org/abs/2509.23055
24. Keizer, Lindenberg & Steg (2008), Science 322: https://doi.org/10.1126/science.1161405
25. Cialdini, Reno & Kallgren (1990), JPSP 58: https://doi.org/10.1037/0022-3514.58.6.1015 · Kallgren, Reno & Cialdini (2000): https://doi.org/10.1177/01461672002610009
26. Vaughan (1996), The Challenger Launch Decision · Rasmussen (1997), Safety Science 27: https://doi.org/10.1016/S0925-7535(97)00052-0 · Dekker (2011), Drift into Failure
27. Grassé (1959), Insectes Sociaux 6: https://doi.org/10.1007/BF02223791 · Heylighen (2016), Cognitive Systems Research 38: https://doi.org/10.1016/j.cogsys.2015.12.002
28. Mesoudi & Whiten (2008), Phil. Trans. R. Soc. B: https://doi.org/10.1098/rstb.2008.0129
29. KAIROS — LLMs Can't Handle Peer Pressure: Crumbling under Multi-Agent Social Interactions: https://arxiv.org/abs/2508.18321 (added 7 Sep, D2; verified)
30. MPBench — From Untrusted Input to Trusted Memory: A Systematic Study of Memory Poisoning Attacks in LLM Agents (Dash et al., v1 3 Jun 2026): https://arxiv.org/abs/2606.04329 (added 7 Sep, D2; verified)
31. MemPoison: Uncovering Persistent Memory Threats and Structural Blind Spots in LLM Agents (Gao et al., 16 Jul 2026): https://arxiv.org/abs/2607.14651 (added 7 Sep, D2; verified)
32. NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf (added 7 Sep, D2)
33. Qwen/Qwen3-8B model card and tool-call template (open-weights tier, E5-open): https://huggingface.co/Qwen/Qwen3-8B — revision b968826d9c46dd6066d109eabc6255188de91218, chat template sha256 a55ee1b1…; Hugging Face Jobs: https://huggingface.co/docs/huggingface_hub/en/guides/jobs
34. Sun et al. (2026), When "Must" Becomes "Maybe": Constraint Weakening in LLM Agent Workflows: https://arxiv.org/abs/2608.24569 (added 8 Sep after the novelty check; abstract verified against arXiv 8 Sep — 25 Aug 2026, 1,296 scenarios, "100.0% deactivation and 54.2% forbidden action")
35. Cerruti, Okamoto & Erol (2026), Agent Memory Is a Surface for Endogenous Authorization Laundering: https://arxiv.org/abs/2609.01836 (added 8 Sep; abstract verified against arXiv 8 Sep — 1 Sep 2026, false authority for up to 50.2 % of unauthorized requests, executors act on it in 98.6 % of trials, no external attack)
36. Chen, Xie, Fu, Zhou, Yu & Xuan (2026), MemSecBench: Tracking Agent Memory Poisoning from Persistence to Consequence and Repair: https://arxiv.org/abs/2607.27080 (added 10 Sep from the D4 reviews; abstract verified against arXiv 10 Sep — 29 Jul 2026, 310 cases, Write–Execute–Forget protocol, four memory backends, persistence 84.2 %, full chain 50.3 %, selective repair 56.1 %; the reviews' claim that its backends include plain markdown files is from the full text and was not verified here)
37. Karunanidhi (2026), Utility Under Attack: Agent Memory Poisoning and the Limits of Content Screening and Provenance Ranking: https://arxiv.org/abs/2608.21230 (added 10 Sep; abstract verified against arXiv 10 Sep — 21 Aug 2026; RAG-memory fact poisoning, content screening rejects 0 of 360 poisoned memories; adjacent, not cited in the papers)

*Novelty check, 8 September (Claude for Science, commissioned by Frank; its report is in the Claude project, not in this package).* The report lists roughly thirty further references and could not reach arXiv, Semantic Scholar or CrossRef from its execution environment. Only entries 34 and 35 and Vallinder & Hughes, Cultural Evolution of Cooperation among LLM Agents (https://arxiv.org/abs/2412.10270) were checked against arXiv here. The paper exists, but the report's reading of it — that the originator is terminated in the generational setup — is not supported by its abstract, so it is not cited. Nothing else from the report is cited in the papers. *D4 reviews, 10 September (Claude for Science: `D4_pruefung_wissenschaftlicher_kern.md`; ChatGPT: `D4_D5_Arbeitsauftrag_20260910.md`; both in the Claude project):* of the four works they name on the deletion/repair axis, MemSecBench (36) and Utility Under Attack (37) were verified against arXiv here; PurgeBench and "Rank-Bounded Memory: Self-Poisoning and Attribution Laundering" could not be found on arXiv or in the Hugging Face papers index from this environment and are neither cited nor used to argue a gap.

